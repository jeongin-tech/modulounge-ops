import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, MapPin, User, FileText } from "lucide-react";
import { syncOrderToChannelTalk } from "@/lib/channelTalk";
import OrderFileUpload from "@/components/OrderFileUpload";
import OrderInquiryButton from "@/components/OrderInquiryButton";
import OrderMemo from "@/components/OrderMemo";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  service_date: string;
  service_location: string;
  amount: number;
  notes: string;
  status: string;
  completed_at: string | null;
  partner_memo: string | null;
}

const OrdersManage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [completedDate, setCompletedDate] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("partner_id", user.id)
        .in("status", ["accepted", "confirmed", "completed"])
        .order("service_date", { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("오더를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!completedDate) {
      toast.error("완료일자를 선택해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          completed_at: completedDate,
          notes: memo,
        })
        .eq("id", orderId);

      if (error) throw error;
      
      // 채널톡에 주문 상태 동기화
      syncOrderToChannelTalk(orderId, 'status_changed');
      
      toast.success("오더가 완료 처리되었습니다!");
      setSelectedOrder(null);
      setMemo("");
      setCompletedDate("");
      fetchOrders();
    } catch (error: any) {
      toast.error("완료 처리에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/orders/manage">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/orders/manage">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            오더 관리
          </h1>
          <p className="text-muted-foreground mt-2">수락한 오더를 관리하고 완료 처리하세요</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">관리할 오더가 없습니다.</p>
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
                        {new Date(order.service_date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        order.status === "completed"
                          ? "bg-green-500"
                          : "bg-gradient-primary"
                      }
                    >
                      {order.status === "completed" ? "완료" : "진행중"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">고객명:</span>
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">장소:</span>
                      <span>{order.service_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">금액:</span>
                      <span className="font-semibold text-primary">
                        ₩{order.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">요청사항</p>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  )}

                  {/* Action buttons - always visible */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <OrderFileUpload
                      orderId={order.id}
                      orderNumber={order.order_number}
                    />
                    <OrderInquiryButton
                      orderNumber={order.order_number}
                      customerName={order.customer_name}
                      serviceDate={order.service_date}
                      serviceLocation={order.service_location}
                      amount={order.amount}
                    />
                    <OrderMemo
                      orderId={order.id}
                      orderNumber={order.order_number}
                      initialMemo={order.partner_memo}
                      onMemoSaved={fetchOrders}
                    />
                  </div>

                  {order.status !== "completed" && (
                    <>
                      {selectedOrder === order.id ? (
                        <div className="space-y-4 pt-2 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="completedDate">완료일자</Label>
                            <Input
                              id="completedDate"
                              type="datetime-local"
                              value={completedDate}
                              onChange={(e) => setCompletedDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="memo">현장 이슈 메모</Label>
                            <Textarea
                              id="memo"
                              placeholder="현장에서 발생한 이슈나 특이사항을 입력하세요..."
                              value={memo}
                              onChange={(e) => setMemo(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleComplete(order.id)}
                              className="flex-1 bg-gradient-primary"
                            >
                              완료 처리
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedOrder(null);
                                setMemo("");
                                setCompletedDate("");
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <Button
                            onClick={() => setSelectedOrder(order.id)}
                            className="w-full bg-gradient-primary"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            완료 처리하기
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {order.status === "completed" && order.completed_at && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        완료일: {new Date(order.completed_at).toLocaleDateString("ko-KR")}
                      </p>
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

export default OrdersManage;
