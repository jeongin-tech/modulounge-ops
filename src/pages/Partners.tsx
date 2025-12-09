import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, DollarSign, ClipboardList, Clock, CheckCircle, XCircle, Search } from "lucide-react";

interface ServiceRegion {
  sido: string;
  gugun: string;
}

interface PartnerStats {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  service_type: string | null;
  service_regions: ServiceRegion[] | null;
  totalOrders: number;
  requestedOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  completedOrders: number;
  totalRevenue: number;
  responseRate: number;
  avgResponseTime: number | null;
}

const Partners = () => {
  const [partners, setPartners] = useState<PartnerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

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
        const { data: allOrders } = await supabase
          .from("orders")
          .select("id, status, created_at, updated_at")
          .eq("partner_id", partner.id);

        const orders = allOrders || [];

        const totalOrders = orders.length;
        const requestedOrders = orders.filter(o => o.status === "requested").length;
        const acceptedOrders = orders.filter(o => 
          ["accepted", "confirmed", "completed", "settled"].includes(o.status)
        ).length;
        const rejectedOrders = orders.filter(o => o.status === "cancelled").length;
        const completedOrders = orders.filter(o => 
          ["completed", "settled"].includes(o.status)
        ).length;

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

        const respondedCount = acceptedOrders + rejectedOrders;
        const totalExcludingPending = respondedCount + requestedOrders;
        const responseRate = totalExcludingPending > 0 
          ? Math.round((respondedCount / totalExcludingPending) * 100)
          : 0;

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
          id: partner.id,
          full_name: partner.full_name,
          company_name: partner.company_name,
          email: partner.email,
          phone: partner.phone,
          service_type: partner.service_type,
          service_regions: (partner.service_regions as unknown) as ServiceRegion[] | null,
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

  // Get unique regions and services for filters
  const { regions, services } = useMemo(() => {
    const regionSet = new Set<string>();
    const serviceSet = new Set<string>();

    partners.forEach(partner => {
      if (partner.service_type) {
        serviceSet.add(partner.service_type);
      }
      if (partner.service_regions && Array.isArray(partner.service_regions)) {
        partner.service_regions.forEach(region => {
          if (region.sido) {
            regionSet.add(region.sido);
          }
        });
      }
    });

    return {
      regions: Array.from(regionSet).sort(),
      services: Array.from(serviceSet).sort(),
    };
  }, [partners]);

  // Filter and sort partners
  const filteredPartners = useMemo(() => {
    let filtered = partners;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(partner =>
        partner.company_name?.toLowerCase().includes(query) ||
        partner.full_name?.toLowerCase().includes(query) ||
        partner.email?.toLowerCase().includes(query)
      );
    }

    // Region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter(partner =>
        partner.service_regions?.some(region => region.sido === regionFilter)
      );
    }

    // Service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(partner =>
        partner.service_type === serviceFilter
      );
    }

    // Sort by response rate (highest first)
    filtered = [...filtered].sort((a, b) => b.responseRate - a.responseRate);

    return filtered;
  }, [partners, searchQuery, regionFilter, serviceFilter]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              제휴업체 응답률관리
            </h1>
            <p className="text-muted-foreground mt-2">
              각 제휴업체별 매출, 정산, 응답률 등을 확인하세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="업체명, 담당자 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[180px]"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="지역 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="서비스 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 서비스</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          총 {filteredPartners.length}개 업체 (응답률 높은 순)
        </div>

        {filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || regionFilter !== "all" || serviceFilter !== "all"
                  ? "검색 결과가 없습니다."
                  : "등록된 제휴업체가 없습니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {partner.company_name || partner.full_name}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <p>{partner.email}</p>
                        {partner.service_type && (
                          <Badge variant="outline" className="text-xs">
                            {partner.service_type}
                          </Badge>
                        )}
                        {partner.service_regions && Array.isArray(partner.service_regions) && partner.service_regions.length > 0 && (
                          <p className="text-xs">
                            {partner.service_regions.map(r => `${r.sido} ${r.gugun}`).join(", ")}
                          </p>
                        )}
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
