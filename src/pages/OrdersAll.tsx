import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, MapPin, User, Building2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderStatusStepper from "@/components/OrderStatusStepper";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  service_date: string;
  service_location: string;
  amount: number;
  status: string;
  partner_id: string;
  partner_profile: {
    company_name: string;
    full_name: string;
  };
}

const OrdersAll = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          partner_profile:profiles!partner_id (
            company_name,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data as any || []);
    } catch (error: any) {
      toast.error("오더를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("오더가 취소되었습니다.");
      fetchOrders();
    } catch (error: any) {
      toast.error("오더 취소에 실패했습니다.");
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("오더가 확정되었습니다!");
      fetchOrders();
    } catch (error: any) {
      toast.error("오더 확정에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      requested: { label: "요청됨", className: "bg-yellow-500" },
      accepted: { label: "수락됨", className: "bg-blue-500" },
      confirmed: { label: "확정됨", className: "bg-gradient-primary" },
      completed: { label: "완료", className: "bg-green-500" },
      settled: { label: "정산완료", className: "bg-purple-500" },
      cancelled: { label: "취소", className: "bg-gray-500" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/orders/all">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/orders/all">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              오더 전체보기
            </h1>
            <p className="text-muted-foreground mt-2">모든 제휴업체의 오더 현황을 확인하세요</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="오더번호, 고객명 검색"
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
                <SelectItem value="requested">요청됨</SelectItem>
                <SelectItem value="accepted">수락됨</SelectItem>
                <SelectItem value="confirmed">확정됨</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="settled">정산완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Guide */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-3">진행상태 안내</p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span><strong>요청</strong> - 접수됨</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span><strong>수락됨</strong> - 파트너 수락</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span><strong>확정됨</strong> - 관리자 확정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span><strong>완료</strong> - 서비스 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span><strong>정산완료</strong> - 정산 처리됨</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span><strong>취소</strong> - 취소/거절됨</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다." : "해당 조건의 오더가 없습니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{order.order_number}</h3>
                        <Badge variant="secondary">{order.service_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.service_date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Order Status Stepper */}
                  <div className="py-3 border-b">
                    <OrderStatusStepper status={order.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">제휴업체</p>
                        <p>{order.partner_profile?.company_name || order.partner_profile?.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">고객명</p>
                        <p>{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">장소</p>
                        <p>{order.service_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-xs text-muted-foreground">금액</p>
                        <p className="font-semibold text-primary">
                          ₩{order.amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.status === "accepted" && (
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                      <Button
                        onClick={() => handleConfirmOrder(order.id)}
                        className="flex-1 bg-gradient-primary"
                        size="sm"
                      >
                        오더 확정
                      </Button>
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        size="sm"
                      >
                        철회
                      </Button>
                    </div>
                  )}

                  {(order.status === "requested" || order.status === "confirmed") && (
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                      <Button
                        onClick={() => handleCancelOrder(order.id)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        오더 철회
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersAll;
