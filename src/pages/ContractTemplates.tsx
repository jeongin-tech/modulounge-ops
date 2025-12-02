import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Template {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  base_guest_count: number;
  additional_price_per_person: number;
  cleaning_fee: number;
  vat_rate: number;
  is_active: boolean;
  created_at: string;
}

const ContractTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("템플릿 조회 오류:", error);
      toast.error("템플릿을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "템플릿이 비활성화되었습니다." : "템플릿이 활성화되었습니다.");
      fetchTemplates();
    } catch (error) {
      console.error("템플릿 상태 변경 오류:", error);
      toast.error("템플릿 상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("템플릿이 삭제되었습니다.");
      fetchTemplates();
    } catch (error) {
      console.error("템플릿 삭제 오류:", error);
      toast.error("템플릿 삭제에 실패했습니다.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout currentPage="/contracts/templates">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">계약서 템플릿 관리</h1>
            <p className="text-muted-foreground mt-1">
              계약서 템플릿을 생성하고 관리하세요
            </p>
          </div>
          <Button onClick={() => navigate("/contracts/templates/create")}>
            <Plus className="mr-2 h-4 w-4" />
            새 템플릿 만들기
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                아직 생성된 템플릿이 없습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {template.name}
                        {template.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            활성
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            비활성
                          </Badge>
                        )}
                      </CardTitle>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">기본 이용료</p>
                        <p className="font-medium">{template.base_price.toLocaleString()}원</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">기본 인원</p>
                        <p className="font-medium">{template.base_guest_count}명</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">인당 추가 요금</p>
                        <p className="font-medium">{template.additional_price_per_person.toLocaleString()}원</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">청소대행비</p>
                        <p className="font-medium">{template.cleaning_fee.toLocaleString()}원</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(template.id, template.is_active)}
                        className="flex-1"
                      >
                        {template.is_active ? "비활성화" : "활성화"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/contracts/templates/edit/${template.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ContractTemplates;
