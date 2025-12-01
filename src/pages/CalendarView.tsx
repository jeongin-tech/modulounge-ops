import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  service_type: string;
  service_date: string;
  service_location: string;
  status: string;
}

const CalendarView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"STAFF" | "PARTNER" | null>(null);

  useEffect(() => {
    fetchUserRoleAndOrders();
  }, []);

  const fetchUserRoleAndOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserRole(profile.role as "STAFF" | "PARTNER");

        let query = supabase
          .from("orders")
          .select("*")
          .order("service_date", { ascending: true });

        if (profile.role === "PARTNER") {
          query = query.eq("partner_id", user.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error: any) {
      toast.error("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getOrdersForDate = (date: Date) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.service_date);
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth() &&
        orderDate.getDate() === date.getDate()
      );
    });
  };

  const selectedDateOrders = selectedDate ? getOrdersForDate(selectedDate) : [];

  const datesWithOrders = orders.map((order) => new Date(order.service_date));

  if (loading) {
    return (
      <DashboardLayout currentPage="/calendar">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/calendar">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            일정 보기
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === "STAFF" ? "전체 오더 일정을 확인하세요" : "나의 오더 일정을 확인하세요"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
                modifiers={{
                  hasOrder: datesWithOrders,
                }}
                modifiersClassNames={{
                  hasOrder: "bg-primary/10 font-bold",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">
                {selectedDate?.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                의 일정
              </h3>

              {selectedDateOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>해당 날짜에 일정이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.service_date).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">{order.service_type}</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">고객:</span> {order.customer_name}
                        </p>
                        <p>
                          <span className="font-medium">장소:</span> {order.service_location}
                        </p>
                        <Badge className="mt-2">
                          {order.status === "requested" && "요청됨"}
                          {order.status === "accepted" && "수락됨"}
                          {order.status === "confirmed" && "확정됨"}
                          {order.status === "completed" && "완료"}
                          {order.status === "settled" && "정산완료"}
                          {order.status === "cancelled" && "취소"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">구글 캘린더 연동</h3>
                <p className="text-sm text-muted-foreground">
                  일정을 구글 캘린더와 동기화하세요
                </p>
              </div>
              <Badge variant="outline">준비중</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CalendarView;
