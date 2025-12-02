import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface PricingItem {
  label: string;
  field: string;
}

const ContractTemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: 340000,
    base_guest_count: 10,
    additional_price_per_person: 25000,
    cleaning_fee: 150000,
    vat_rate: 0.1,
    image_urls: [] as string[],
    pricing_items: [
      { label: "기본 이용료 (10인 기준)", field: "base_price" },
      { label: "인원 추가", field: "additional_price" },
      { label: "청소대행", field: "cleaning_fee" },
      { label: "부가세", field: "vat" },
    ] as PricingItem[],
    terms_content: `■ 이용 유의사항

• 벽면에 테이프·접착제 부착 금지 (자국 발생 시 청소비 10만 원 이상 부과)
• 토사물 발생 시 청소비 10만 원 부과
• 전 구역 흡연 금지(전자담배 포함) — 위반 시 CCTV 확인 후 청소비 10만 원 이상 부과
• 내부 기물 및 인테리어 소품 파손 시 수리비 또는 교체비 전액 청구
• 기본 음향 서비스 제공
• 기기 보호를 위해 음향 설정은 기본값으로 고정
• 중요 행사 시 음향 렌탈 옵션 권장
• 미성년자는 오후 7시 이후 대관 불가
• 예약은 결제 완료 순으로 확정
• 이용 후 남은 물품은 모두 폐기
• 시간 추가(7만 원)는 종료 3시간 전까지 요청
• 올나잇 타임은 오후 10시까지 예약 가능
• 입·퇴실 시 CCTV 확인
• 계약 인원 초과 시 즉시 추가요금 및 패널티 부과
• 전 타임 예약이 있을 경우 사전 입실 불가`,
    refund_policy: `■ 환불 규정

• 인원 확정 후 인원 조정으로 인한 차액 환불 불가
• 개인 사유(취소·변경 포함)도 동일 규정 적용

환불 기준:
• 결제 완료 ~ 이용일 8일 전: 총 금액의 20% 공제 후 80% 환불
• 이용일 7일 전 ~ 당일: 환불 불가

날짜/지점 변경 규정:
• 이용일 8일 전까지 변경 가능
• 총 금액의 20% 추가 납부 시 이월 가능
• 지점 변경은 해당 일자에 타 지점 예약이 없을 경우만 가능

※ 위 규정은 옵션 및 부가세 포함 전체 금액에 적용됩니다.`,
  });

  useEffect(() => {
    if (isEdit) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFormData({
        name: data.name,
        description: data.description || "",
        base_price: data.base_price,
        base_guest_count: data.base_guest_count,
        additional_price_per_person: data.additional_price_per_person,
        cleaning_fee: data.cleaning_fee,
        vat_rate: data.vat_rate,
        image_urls: Array.isArray(data.image_urls) ? (data.image_urls as unknown as string[]) : [],
        pricing_items: Array.isArray(data.pricing_items) ? (data.pricing_items as unknown as PricingItem[]) : [
          { label: "기본 이용료 (10인 기준)", field: "base_price" },
          { label: "인원 추가", field: "additional_price" },
          { label: "청소대행", field: "cleaning_fee" },
          { label: "부가세", field: "vat" },
        ],
        terms_content: data.terms_content,
        refund_policy: data.refund_policy,
      });
    } catch (error) {
      console.error("템플릿 조회 오류:", error);
      toast.error("템플릿을 불러오는데 실패했습니다.");
      navigate("/contracts/templates");
    }
  };

  const addPricingItem = () => {
    setFormData((prev) => ({
      ...prev,
      pricing_items: [
        ...prev.pricing_items,
        { label: "", field: `custom_${Date.now()}` },
      ],
    }));
  };

  const updatePricingItem = (index: number, label: string) => {
    setFormData((prev) => ({
      ...prev,
      pricing_items: prev.pricing_items.map((item, i) =>
        i === index ? { ...item, label } : item
      ),
    }));
  };

  const removePricingItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing_items: prev.pricing_items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      if (isEdit) {
        const { error } = await supabase
          .from("contract_templates")
          .update({
            ...formData,
            image_urls: formData.image_urls as any,
            pricing_items: formData.pricing_items as any,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("템플릿이 수정되었습니다.");
      } else {
        const { error } = await supabase
          .from("contract_templates")
          .insert([
            {
              ...formData,
              image_urls: formData.image_urls as any,
              pricing_items: formData.pricing_items as any,
              created_by: user.id,
            },
          ]);

        if (error) throw error;
        toast.success("템플릿이 생성되었습니다.");
      }

      navigate("/contracts/templates");
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
      toast.error("템플릿 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="/contracts/templates">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/contracts/templates")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "템플릿 수정" : "새 템플릿 만들기"}
            </h1>
            <p className="text-muted-foreground mt-1">
              계약서에 사용할 템플릿을 설정하세요
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">템플릿 이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="예: 기본 계약서, VIP 계약서"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="템플릿에 대한 설명을 입력하세요"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>요금 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">기본 이용료 *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_price: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_guest_count">기본 인원 *</Label>
                  <Input
                    id="base_guest_count"
                    type="number"
                    value={formData.base_guest_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_guest_count: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_price_per_person">인당 추가 요금 *</Label>
                  <Input
                    id="additional_price_per_person"
                    type="number"
                    value={formData.additional_price_per_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additional_price_per_person: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaning_fee">청소대행비 *</Label>
                  <Input
                    id="cleaning_fee"
                    type="number"
                    value={formData.cleaning_fee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cleaning_fee: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat_rate">부가세율 *</Label>
                  <Input
                    id="vat_rate"
                    type="number"
                    step="0.01"
                    value={formData.vat_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vat_rate: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.1 = 10%"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base">요금 항목 라벨 (계약서에 표시될 이름)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPricingItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    항목 추가
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.pricing_items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updatePricingItem(index, e.target.value)}
                        placeholder="예: 기본 이용료, 인원 추가"
                        required
                      />
                      {formData.pricing_items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePricingItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  계약서 작성 시 이 라벨로 표시됩니다
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이용 약관</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_content">이용 유의사항 *</Label>
                <Textarea
                  id="terms_content"
                  value={formData.terms_content}
                  onChange={(e) =>
                    setFormData({ ...formData, terms_content: e.target.value })
                  }
                  rows={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund_policy">환불 규정 *</Label>
                <Textarea
                  id="refund_policy"
                  value={formData.refund_policy}
                  onChange={(e) =>
                    setFormData({ ...formData, refund_policy: e.target.value })
                  }
                  rows={10}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contracts/templates")}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "저장 중..." : isEdit ? "수정하기" : "템플릿 만들기"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ContractTemplateForm;
