import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, Calendar } from "lucide-react";

interface Settlement {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  confirmed_at: string | null;
  orders: {
    order_number: string;
    service_type: string;
    customer_name: string;
  };
}

const Settlements = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("settlements")
        .select(`
          *,
          orders (
            order_number,
            service_type,
            customer_name
          )
        `)
        .eq("partner_id", user.id)
        .eq("status", "confirmed")
        .order("payment_date", { ascending: true });

      if (error) throw error;

      setSettlements(data || []);
      const total = data?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
      setTotalAmount(total);
    } catch (error: any) {
      toast.error("정산 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const groupSettlementsByMonth = () => {
    const grouped: Record<string, Settlement[]> = {};

    settlements.forEach((settlement) => {
      const date = new Date(settlement.payment_date);
      const monthKey = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(settlement);
    });

    return grouped;
  };

  const groupedSettlements = groupSettlementsByMonth();

  if (loading) {
    return (
      <DashboardLayout currentPage="/settlements">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="/settlements">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            정산 현황
          </h1>
          <p className="text-muted-foreground mt-2">정산 확정된 오더의 입금 예정 내역을 확인하세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                총 정산 예정 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ₩{totalAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                정산 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{settlements.length}건</p>
            </CardContent>
          </Card>
        </div>

        {settlements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">정산 예정 내역이 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                완료된 오더가 내부직원에 의해 정산 확정되면 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSettlements).map(([month, monthSettlements]) => (
              <Card key={month}>
                <CardHeader>
                  <CardTitle>{month}</CardTitle>
                  <CardDescription>
                    총 {monthSettlements.length}건 | 합계: ₩
                    {monthSettlements
                      .reduce((sum, s) => sum + Number(s.amount), 0)
                      .toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthSettlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{settlement.orders.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {settlement.orders.service_type} | {settlement.orders.customer_name}
                            </p>
                          </div>
                          <Badge className="bg-green-500">정산 확정</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>입금예정일:</span>
                            <span className="font-medium">
                              {new Date(settlement.payment_date).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            ₩{Number(settlement.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
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

export default Settlements;
