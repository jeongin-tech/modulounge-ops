import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Calendar, DollarSign } from "lucide-react";

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

const SettlementsManage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState("");

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          partner_profile:profiles!partner_id (
            company_name,
            full_name
          )
        `)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (error) throw error;

      // Filter out orders that already have settlements
      const { data: existingSettlements } = await supabase
        .from("settlements")
        .select("order_id");

      const settledOrderIds = new Set(
        existingSettlements?.map((s) => s.order_id) || []
      );

      const unsettledOrders = (data as any)?.filter(
        (order: any) => !settledOrderIds.has(order.id)
      ) || [];

      setOrders(unsettledOrders);
    } catch (error: any) {
      toast.error("완료된 오더를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

      toast.success("정산이 확정되었습니다!");
      setSelectedOrder(null);
      setPaymentDate("");
      fetchCompletedOrders();
    } catch (error: any) {
      toast.error(error.message || "정산 확정에 실패했습니다.");
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            정산 관리
          </h1>
          <p className="text-muted-foreground mt-2">
            완료된 오더를 정산 확정하고 입금 예정일을 설정하세요
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">정산 대기중인 오더가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>{order.order_number}</span>
                        <Badge variant="secondary">{order.service_type}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        완료일: {new Date(order.completed_at).toLocaleDateString("ko-KR")}
                      </CardDescription>
                    </div>
                    <Badge className="bg-yellow-500">정산 대기</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">제휴업체:</span>
                      <span>
                        {order.partner_profile?.company_name || order.partner_profile?.full_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">정산금액:</span>
                      <span className="font-semibold text-primary text-lg">
                        ₩{order.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedOrder === order.id ? (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">입금 예정일</Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleConfirmSettlement(order)}
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
                      onClick={() => setSelectedOrder(order.id)}
                      className="w-full bg-gradient-primary"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      정산 확정하기
                    </Button>
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

export default SettlementsManage;
