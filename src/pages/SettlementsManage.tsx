import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, Calendar, DollarSign, CheckCircle, Search, Trash2 } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  amount: number;
  completed_at: string;
  partner_id: string;
  partner_profile: {
    company_name: string;
    full_name: string;
  };
}

interface Settlement {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  payment_date: string;
  confirmed_at: string;
}

interface SettlementItem {
  order: Order;
  settlement: Settlement | null;
  status: "pending" | "confirmed";
}

const ITEMS_PER_PAGE = 20;

const SettlementsManage = () => {
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchSettlements();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchSettlements = async () => {
    try {
      // Fetch completed and settled orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          partner_profile:profiles!partner_id (
            company_name,
            full_name
          )
        `)
        .in("status", ["completed", "settled"])
        .order("completed_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all settlements
      const { data: settlements, error: settlementsError } = await supabase
        .from("settlements")
        .select("*");

      if (settlementsError) throw settlementsError;

      const settlementMap = new Map(
        settlements?.map((s) => [s.order_id, s]) || []
      );

      const settlementItems: SettlementItem[] = (orders || []).map((order: any) => {
        const settlement = settlementMap.get(order.id) || null;
        return {
          order,
          settlement,
          status: settlement ? "confirmed" : "pending",
        };
      });

      setItems(settlementItems);
    } catch (error: any) {
      toast.error("정산 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.order.order_number.toLowerCase().includes(query) ||
          item.order.customer_name.toLowerCase().includes(query) ||
          item.order.partner_profile?.company_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleConfirmSettlement = async (order: Order) => {
    if (!paymentDate) {
      toast.error("입금 예정일을 선택해주세요.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const { error } = await supabase.from("settlements").insert({
        order_id: order.id,
        partner_id: order.partner_id,
        amount: order.amount,
        payment_date: paymentDate,
        status: "confirmed",
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update order status
      await supabase
        .from("orders")
        .update({ status: "settled" })
        .eq("id", order.id);

      // Send notification to partner
      await supabase.from("notifications").insert({
        user_id: order.partner_id,
        title: "정산이 확정되었습니다",
        message: `오더번호 ${order.order_number} (${order.customer_name})의 정산이 확정되었습니다. 입금 예정일: ${new Date(paymentDate).toLocaleDateString("ko-KR")}`,
        type: "success",
        related_order_id: order.id,
      });

      toast.success("정산이 확정되었습니다!");
      setSelectedOrder(null);
      setPaymentDate("");
      fetchSettlements();
    } catch (error: any) {
      toast.error(error.message || "정산 확정에 실패했습니다.");
    }
  };

  const handleSelectItem = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedItems.map((item) => item.order.id);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkDelete = async () => {
    try {
      const selectedArray = Array.from(selectedItems);
      
      for (const orderId of selectedArray) {
        const item = items.find((i) => i.order.id === orderId);
        if (!item) continue;

        // Delete settlement if exists
        if (item.settlement) {
          await supabase
            .from("settlements")
            .delete()
            .eq("id", item.settlement.id);
        }

        // Update order status back to completed
        await supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("id", orderId);
      }

      toast.success(`${selectedArray.length}건의 정산이 삭제되었습니다.`);
      setSelectedItems(new Set());
      setShowDeleteDialog(false);
      fetchSettlements();
    } catch (error) {
      toast.error("정산 삭제에 실패했습니다.");
    }
  };

  const isAllSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedItems.has(item.order.id));

  if (loading) {
    return (
      <DashboardLayout currentPage="/settlements/manage">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/settlements/manage">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              정산 관리
            </h1>
            <p className="text-muted-foreground mt-2">
              완료된 오더를 정산 확정하고 입금 예정일을 설정하세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="오더번호, 고객명, 업체명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">정산 대기</SelectItem>
                <SelectItem value="confirmed">정산 확정</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다." : "정산 대상 오더가 없습니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                    전체 선택
                  </label>
                </div>
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    선택 삭제 ({selectedItems.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>총 {filteredItems.length}건</span>
                <span>{currentPage} / {totalPages} 페이지</span>
              </div>
            </div>
            <div className="grid gap-6">
              {paginatedItems.map((item) => (
                <Card key={item.order.id} className={`hover:shadow-lg transition-shadow ${selectedItems.has(item.order.id) ? "ring-2 ring-primary" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.has(item.order.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.order.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <span>{item.order.order_number}</span>
                            <Badge variant="secondary">{item.order.service_type}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            완료일: {new Date(item.order.completed_at).toLocaleDateString("ko-KR")}
                          </CardDescription>
                        </div>
                      </div>
                      {item.status === "confirmed" ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          정산 확정
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500">정산 대기</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">제휴업체:</span>
                        <span>
                          {item.order.partner_profile?.company_name || item.order.partner_profile?.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">정산금액:</span>
                        <span className="font-semibold text-primary text-lg">
                          ₩{item.order.amount?.toLocaleString()}
                        </span>
                      </div>
                      {item.settlement && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">입금 예정일:</span>
                          <span className="text-green-600 font-medium">
                            {new Date(item.settlement.payment_date).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.status === "pending" && (
                      <>
                        {selectedOrder === item.order.id ? (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                              <Label htmlFor="paymentDate">입금 예정일</Label>
                              <Input
                                id="paymentDate"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 10)}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleConfirmSettlement(item.order)}
                                className="flex-1 bg-gradient-primary"
                              >
                                정산 확정
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedOrder(null);
                                  setPaymentDate("");
                                }}
                                variant="outline"
                                className="flex-1"
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setSelectedOrder(item.order.id)}
                            className="w-full bg-gradient-primary"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            정산 확정하기
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>선택한 정산을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItems.size}건의 정산이 삭제됩니다. 정산이 확정된 오더는 완료 상태로 되돌아갑니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SettlementsManage;
