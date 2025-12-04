import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, DollarSign, ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";

interface PartnerStats {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  totalOrders: number;
  requestedOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  completedOrders: number;
  totalRevenue: number;
  responseRate: number;
  avgResponseTime: number | null; // in minutes
}

const Partners = () => {
  const [partners, setPartners] = useState<PartnerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartnersStats();
  }, []);

  const fetchPartnersStats = async () => {
    try {
      const { data: partnersData, error: partnersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "PARTNER")
        .order("full_name");

      if (partnersError) throw partnersError;

      const statsPromises = partnersData.map(async (partner) => {
        // Get all orders for this partner
        const { data: allOrders } = await supabase
          .from("orders")
          .select("id, status, created_at, updated_at")
          .eq("partner_id", partner.id);

        const orders = allOrders || [];

        // Count by status
        const totalOrders = orders.length;
        const requestedOrders = orders.filter(o => o.status === "requested").length;
        const acceptedOrders = orders.filter(o => 
          ["accepted", "confirmed", "completed", "settled"].includes(o.status)
        ).length;
        const rejectedOrders = orders.filter(o => o.status === "cancelled").length;
        const completedOrders = orders.filter(o => 
          ["completed", "settled"].includes(o.status)
        ).length;

        // Calculate average response time for accepted orders
        const respondedOrders = orders.filter(o => 
          ["accepted", "confirmed", "completed", "settled", "cancelled"].includes(o.status)
        );
        
        let avgResponseTime: number | null = null;
        if (respondedOrders.length > 0) {
          const totalMinutes = respondedOrders.reduce((sum, order) => {
            const created = new Date(order.created_at).getTime();
            const updated = new Date(order.updated_at).getTime();
            const diffMinutes = (updated - created) / (1000 * 60);
            return sum + diffMinutes;
          }, 0);
          avgResponseTime = Math.round(totalMinutes / respondedOrders.length);
        }

        // Calculate response rate (responded / total excluding currently requested)
        const respondedCount = acceptedOrders + rejectedOrders;
        const totalExcludingPending = respondedCount + requestedOrders;
        const responseRate = totalExcludingPending > 0 
          ? Math.round((respondedCount / totalExcludingPending) * 100)
          : 0;

        // Get total revenue from settlements
        const { data: settlements } = await supabase
          .from("settlements")
          .select("amount")
          .eq("partner_id", partner.id)
          .eq("status", "confirmed");

        const totalRevenue = settlements?.reduce(
          (sum, s) => sum + Number(s.amount),
          0
        ) || 0;

        return {
          ...partner,
          totalOrders,
          requestedOrders,
          acceptedOrders,
          rejectedOrders,
          completedOrders,
          totalRevenue,
          responseRate,
          avgResponseTime,
        };
      });

      const stats = await Promise.all(statsPromises);
      setPartners(stats);
    } catch (error: any) {
      toast.error("제휴업체 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (minutes: number | null) => {
    if (minutes === null) return "-";
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}일 ${remainingHours}시간` : `${days}일`;
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="/partners">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/partners">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            제휴업체 대시보드
          </h1>
          <p className="text-muted-foreground mt-2">
            각 제휴업체별 매출, 정산, 응답률 등을 확인하세요
          </p>
        </div>

        {partners.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">등록된 제휴업체가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {partner.company_name || partner.full_name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {partner.email}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={partner.responseRate >= 80 ? "default" : "secondary"}
                    >
                      응답률 {partner.responseRate}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 응답 시간 */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">평균 응답시간</span>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatResponseTime(partner.avgResponseTime)}
                    </span>
                  </div>

                  {/* 오더 현황 */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">총 요청</p>
                      <p className="text-lg font-bold">{partner.totalOrders}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">수락</p>
                      <p className="text-lg font-bold text-green-600">{partner.acceptedOrders}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">거절</p>
                      <p className="text-lg font-bold text-red-600">{partner.rejectedOrders}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-xs text-muted-foreground">완료</p>
                      <p className="text-lg font-bold text-blue-600">{partner.completedOrders}</p>
                    </div>
                  </div>

                  {/* 정산 금액 */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">총 정산 금액</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₩{partner.totalRevenue.toLocaleString()}
                    </p>
                  </div>

                  {partner.phone && (
                    <div className="pt-4 border-t text-sm text-muted-foreground">
                      <p>연락처: {partner.phone}</p>
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

export default Partners;
