import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Calendar, DollarSign, MessageSquare } from "lucide-react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSettlements: number;
  unreadMessages: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSettlements: 0,
    unreadMessages: 0,
  });
  const [userRole, setUserRole] = useState<"STAFF" | "PARTNER" | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserRole(profile.role as "STAFF" | "PARTNER");

        let ordersQuery = supabase.from("orders").select("*", { count: "exact" });
        
        if (profile.role === "PARTNER") {
          ordersQuery = ordersQuery.eq("partner_id", user.id);
        }

        const { count: totalCount } = await ordersQuery;
        const { count: pendingCount } = await ordersQuery.in("status", ["requested", "accepted"]);
        const { count: completedCount } = await ordersQuery.eq("status", "completed");

        let settlementsQuery = supabase.from("settlements").select("amount", { count: "exact" });
        if (profile.role === "PARTNER") {
          settlementsQuery = settlementsQuery.eq("partner_id", user.id);
        }
        const { data: settlements } = await settlementsQuery;

        const totalSettlements = settlements?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact" })
          .eq("receiver_id", user.id)
          .eq("is_read", false);

        setStats({
          totalOrders: totalCount || 0,
          pendingOrders: pendingCount || 0,
          completedOrders: completedCount || 0,
          totalSettlements,
          unreadMessages: unreadCount || 0,
        });
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "전체 오더",
      value: stats.totalOrders,
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      description: "총 오더 건수",
    },
    {
      title: "진행중인 오더",
      value: stats.pendingOrders,
      icon: <Calendar className="h-8 w-8 text-secondary" />,
      description: "수락 대기 및 진행중",
    },
    {
      title: "완료된 오더",
      value: stats.completedOrders,
      icon: <ClipboardList className="h-8 w-8 text-accent" />,
      description: "완료 처리된 오더",
    },
    {
      title: userRole === "STAFF" ? "총 정산금액" : "내 정산금액",
      value: `₩${stats.totalSettlements.toLocaleString()}`,
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      description: "정산 완료 금액",
    },
    {
      title: "읽지 않은 메시지",
      value: stats.unreadMessages,
      icon: <MessageSquare className="h-8 w-8 text-secondary" />,
      description: "새로운 메시지",
    },
  ];

  return (
    <DashboardLayout currentPage="/">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            대시보드
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === "STAFF" ? "전체 오더 및 정산 현황을 확인하세요" : "나의 오더 현황을 확인하세요"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <CardDescription className="mt-1">{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>최근 오더 및 메시지 활동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>최근 활동 내역이 없습니다.</p>
              <p className="text-sm mt-2">새로운 오더가 생성되면 여기에 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
