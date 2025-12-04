import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, MapPin, User } from "lucide-react";
import { syncOrderToChannelTalk } from "@/lib/channelTalk";

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
}

const OrdersAccept = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
        .eq("status", "requested")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("오더를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // 오더 정보 가져오기
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("오더를 찾을 수 없습니다.");

      const { error } = await supabase
        .from("orders")
        .update({ status: "accepted" })
        .eq("id", orderId);

      if (error) throw error;

      // 캘린더 이벤트 생성
      const serviceDate = new Date(order.service_date);
      const endDate = new Date(serviceDate);
      endDate.setHours(endDate.getHours() + 2); // 기본 2시간 일정

      const { error: calendarError } = await supabase
        .from("calendar_events")
        .insert({
          title: `[${order.service_type}] ${order.customer_name}`,
          start_time: serviceDate.toISOString(),
          end_time: endDate.toISOString(),
          event_type: order.service_type,
          location: order.service_location,
          description: `주문번호: ${order.order_number}\n금액: ₩${order.amount?.toLocaleString()}\n${order.notes || ''}`,
          created_by: user.id,
          color: "#3b82f6",
        });

      if (calendarError) {
        console.error("캘린더 이벤트 생성 실패:", calendarError);
      }
      
      // 채널톡에 주문 상태 동기화
      syncOrderToChannelTalk(orderId, 'status_changed');
      
      toast.success("오더를 수락하고 일정에 추가했습니다!");
      fetchOrders();
    } catch (error: any) {
      toast.error("오더 수락에 실패했습니다.");
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;
      
      // 채널톡에 주문 상태 동기화
      syncOrderToChannelTalk(orderId, 'status_changed');
      
      toast.success("오더를 거절했습니다.");
      fetchOrders();
    } catch (error: any) {
      toast.error("오더 거절에 실패했습니다.");
    }
  };


  if (loading) {
    return (
      <DashboardLayout currentPage="/orders/accept">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/orders/accept">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            오더 수락
          </h1>
          <p className="text-muted-foreground mt-2">수락 대기중인 오더를 확인하고 응답하세요</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">수락 대기중인 오더가 없습니다.</p>
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
                    <Badge className="bg-gradient-primary">수락 대기</Badge>
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

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleAccept(order.id)}
                      className="flex-1 bg-gradient-primary"
                    >
                      수락
                    </Button>
                    <Button
                      onClick={() => handleReject(order.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      거절
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersAccept;
