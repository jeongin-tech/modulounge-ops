import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, DollarSign, ClipboardList } from "lucide-react";

interface PartnerStats {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  responseRate: number;
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
        // Get total orders
        const { count: totalCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", partner.id);

        // Get completed orders (including settled)
        const { count: completedCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", partner.id)
          .in("status", ["completed", "settled"]);

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

        // Calculate response rate
        const { count: requestedCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", partner.id)
          .eq("status", "requested");

        const { count: acceptedCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("partner_id", partner.id)
          .in("status", ["accepted", "confirmed", "completed", "settled"]);

        const responseRate =
          totalCount && totalCount > 0
            ? Math.round(((acceptedCount || 0) / totalCount) * 100)
            : 0;

        return {
          ...partner,
          totalOrders: totalCount || 0,
          completedOrders: completedCount || 0,
          totalRevenue,
          responseRate,
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        <span className="text-xs">총 오더</span>
                      </div>
                      <p className="text-2xl font-bold">{partner.totalOrders}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        <span className="text-xs">완료</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {partner.completedOrders}
                      </p>
                    </div>
                  </div>

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
