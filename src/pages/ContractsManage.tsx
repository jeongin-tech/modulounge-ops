import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Contract {
  id: string;
  location: string;
  reservation_date: string;
  guest_count: number;
  total_amount: number;
  customer_name: string | null;
  agreed: boolean;
  submitted_at: string | null;
  access_token: string;
  created_at: string;
}

const ContractsManage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("계약서 조회 오류:", error);
      toast.error("계약서를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyContractLink = (accessToken: string) => {
    const link = `${window.location.origin}/contract/${accessToken}`;
    navigator.clipboard.writeText(link);
    toast.success("계약서 링크가 복사되었습니다.");
  };

  return (
    <DashboardLayout currentPage="/contracts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">전자서명관리</h1>
            <p className="text-muted-foreground mt-1">
              계약서를 생성하고 고객에게 전송하세요
            </p>
          </div>
          <Button onClick={() => navigate("/contracts/create")}>
            <Plus className="mr-2 h-4 w-4" />
            새 계약서 작성
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : contracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                아직 생성된 계약서가 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {contract.location}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(contract.reservation_date), "yyyy년 MM월 dd일")} · {contract.guest_count}명
                      </p>
                    </div>
                    {contract.agreed ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        서명완료
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        대기중
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">고객명</p>
                      <p className="font-medium">
                        {contract.customer_name || "미작성"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">총 금액</p>
                      <p className="font-medium">
                        {contract.total_amount.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">생성일</p>
                      <p className="font-medium">
                        {format(new Date(contract.created_at), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                    {contract.submitted_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">제출일</p>
                        <p className="font-medium">
                          {format(new Date(contract.submitted_at), "yyyy-MM-dd HH:mm")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyContractLink(contract.access_token)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      링크 복사
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/contract/${contract.access_token}`, "_blank")}
                    >
                      미리보기
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

export default ContractsManage;
