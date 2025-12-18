import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface PricingItem {
  label: string;
  value: number;
  type: "number" | "percent";
}

interface ReservationItem {
  label: string;
  value: string;
  type: "text" | "date" | "time" | "number" | "textarea";
}

interface Template {
  id: string;
  name: string;
  pricing_items: PricingItem[];
  terms_content: string;
  refund_policy: string;
}

const DEFAULT_PRICING_ITEMS: PricingItem[] = [
  { label: "기본 이용료", value: 0, type: "number" },
  { label: "기본 인원", value: 0, type: "number" },
  { label: "인당 추가 요금", value: 0, type: "number" },
  { label: "청소대행비", value: 0, type: "number" },
  { label: "부가세율", value: 0, type: "percent" },
];

const DEFAULT_RESERVATION_ITEMS: ReservationItem[] = [
  { label: "예약서비스", value: "", type: "text" },
  { label: "예약 날짜", value: "", type: "date" },
  { label: "입실 시간", value: "", type: "time" },
  { label: "퇴실 시간", value: "", type: "time" },
  { label: "이용 인원", value: "", type: "number" },
  { label: "이용 목적", value: "", type: "textarea" },
];

const DEFAULT_TERMS_CONTENT = `■ 이용 유의사항

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
• 전 타임 예약이 있을 경우 사전 입실 불가`;

const DEFAULT_REFUND_POLICY = `■ 환불 규정

• 인원 확정 후 인원 조정으로 인한 차액 환불 불가
• 개인 사유(취소·변경 포함)도 동일 규정 적용

환불 기준:
• 결제 완료 ~ 이용일 8일 전: 총 금액의 20% 공제 후 80% 환불
• 이용일 7일 전 ~ 당일: 환불 불가

날짜/지점 변경 규정:
• 이용일 8일 전까지 변경 가능
• 총 금액의 20% 추가 납부 시 이월 가능
• 지점 변경은 해당 일자에 타 지점 예약이 없을 경우만 가능

※ 위 규정은 옵션 및 부가세 포함 전체 금액에 적용됩니다.`;

const ContractCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [pricingItems, setPricingItems] = useState<PricingItem[]>(DEFAULT_PRICING_ITEMS);
  const [termsContent, setTermsContent] = useState<string>(DEFAULT_TERMS_CONTENT);
  const [refundPolicy, setRefundPolicy] = useState<string>(DEFAULT_REFUND_POLICY);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>(DEFAULT_RESERVATION_ITEMS);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      const templatesWithPricingItems = (data || []).map((t) => {
        let pricingItems: PricingItem[] = DEFAULT_PRICING_ITEMS;
        
        if (Array.isArray(t.pricing_items)) {
          const items = t.pricing_items as any[];
          // 새 형식인지 확인 (value 속성이 있는지)
          if (items.length > 0 && 'value' in items[0]) {
            pricingItems = items as PricingItem[];
          } else {
            // 구 형식을 새 형식으로 변환
            pricingItems = [
              { label: "기본 이용료", value: t.base_price || 0, type: "number" as const },
              { label: "기본 인원", value: t.base_guest_count || 0, type: "number" as const },
              { label: "인당 추가 요금", value: t.additional_price_per_person || 0, type: "number" as const },
              { label: "청소대행비", value: t.cleaning_fee || 0, type: "number" as const },
              { label: "부가세율", value: t.vat_rate || 0, type: "percent" as const },
            ];
          }
        }
        
        return {
          id: t.id,
          name: t.name,
          pricing_items: pricingItems,
          terms_content: t.terms_content || "",
          refund_policy: t.refund_policy || "",
        };
      });
      
      setTemplates(templatesWithPricingItems);
    } catch (error) {
      console.error("템플릿 조회 오류:", error);
    }
  };

  const applyTemplate = (template: Template) => {
    // 템플릿의 요금 항목을 적용
    setPricingItems(template.pricing_items);
    
    // 유의사항 및 환불정책 적용
    setTermsContent(template.terms_content);
    setRefundPolicy(template.refund_policy);
    
    // 총액 계산 (% 타입은 다른 금액들의 합에 대한 비율로 계산)
    calculateTotal(template.pricing_items);
  };

  const calculateTotal = (items: PricingItem[]) => {
    // 숫자 타입 합계
    const numberSum = items
      .filter(item => item.type === "number")
      .reduce((sum, item) => sum + item.value, 0);
    
    // 퍼센트 타입 계산 (숫자 합계에 대한 비율)
    const percentSum = items
      .filter(item => item.type === "percent")
      .reduce((sum, item) => sum + Math.round(numberSum * item.value), 0);
    
    const total = numberSum + percentSum;
    setTotalAmount(total);
  };

  const handleReservationItemChange = (index: number, field: keyof ReservationItem, value: string) => {
    const newItems = reservationItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setReservationItems(newItems);
  };

  const addReservationItem = () => {
    setReservationItems([
      ...reservationItems,
      { label: "", value: "", type: "text" as const },
    ]);
  };

  const removeReservationItem = (index: number) => {
    setReservationItems(reservationItems.filter((_, i) => i !== index));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      applyTemplate(template);
    }
  };

  const handlePricingItemChange = (index: number, field: keyof PricingItem, value: string | number) => {
    const newItems = pricingItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setPricingItems(newItems);
    calculateTotal(newItems);
  };

  const addPricingItem = () => {
    const newItems = [
      ...pricingItems,
      { label: "", value: 0, type: "number" as const },
    ];
    setPricingItems(newItems);
  };

  const removePricingItem = (index: number) => {
    const newItems = pricingItems.filter((_, i) => i !== index);
    setPricingItems(newItems);
    calculateTotal(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // reservationItems에서 호환성을 위한 기존 필드 추출
      const getReservationValue = (label: string) => {
        const item = reservationItems.find(i => i.label === label);
        return item?.value || "";
      };

      // 호환성을 위해 기존 필드도 저장
      const basePrice = pricingItems[0]?.value || 0;
      const cleaningFee = pricingItems[3]?.value || 0;
      const vatRate = pricingItems[4]?.value || 0;
      const subtotal = pricingItems.filter(i => i.type === "number").reduce((s, i) => s + i.value, 0);
      const vat = Math.round(subtotal * vatRate);

      const { data, error } = await supabase
        .from("contracts")
        .insert([
          {
            location: getReservationValue("예약서비스"),
            reservation_date: getReservationValue("예약 날짜"),
            checkin_time: getReservationValue("입실 시간") || "00:00",
            checkout_time: getReservationValue("퇴실 시간") || "00:00",
            guest_count: parseInt(getReservationValue("이용 인원")) || 0,
            purpose: getReservationValue("이용 목적"),
            base_price: basePrice,
            additional_price: pricingItems[2]?.value || 0,
            cleaning_fee: cleaningFee,
            vat: vat,
            total_amount: totalAmount,
            template_id: selectedTemplate || null,
            created_by: user.id,
            terms_content: termsContent,
            refund_policy: refundPolicy,
            pricing_items: JSON.parse(JSON.stringify(pricingItems)),
            reservation_items: JSON.parse(JSON.stringify(reservationItems)),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("계약서가 생성되었습니다.");
      
      // Copy link automatically
      const link = `${window.location.origin}/contract/${data.access_token}`;
      navigator.clipboard.writeText(link);
      toast.success("계약서 링크가 클립보드에 복사되었습니다.");
      
      navigate("/contracts");
    } catch (error) {
      console.error("계약서 생성 오류:", error);
      toast.error("계약서 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="/contracts">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/contracts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">새 계약서 작성</h1>
            <p className="text-muted-foreground mt-1">
              예약 정보를 입력하고 고객에게 전송할 계약서를 생성하세요
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>템플릿 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">계약서 템플릿 *</Label>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    활성화된 템플릿이 없습니다.{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate("/contracts/templates")}
                    >
                      템플릿 관리로 이동
                    </Button>
                  </p>
                ) : (
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="템플릿을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>예약 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {reservationItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => handleReservationItemChange(index, "label", e.target.value)}
                        placeholder="항목명"
                      />
                      <select
                        value={item.type}
                        onChange={(e) => handleReservationItemChange(index, "type", e.target.value)}
                        className="px-3 py-2 border rounded-md bg-background text-sm"
                      >
                        <option value="text">텍스트</option>
                        <option value="date">날짜</option>
                        <option value="time">시간</option>
                        <option value="number">숫자</option>
                        <option value="textarea">긴 텍스트</option>
                      </select>
                      {item.type === "textarea" ? (
                        <Textarea
                          value={item.value}
                          onChange={(e) => handleReservationItemChange(index, "value", e.target.value)}
                          placeholder="값 입력"
                          className="md:col-span-1"
                        />
                      ) : (
                        <Input
                          type={item.type === "date" ? "date" : item.type === "time" ? "time" : item.type === "number" ? "number" : "text"}
                          value={item.value}
                          onChange={(e) => handleReservationItemChange(index, "value", e.target.value)}
                          placeholder="값 입력"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReservationItem(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addReservationItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이용 요금</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {pricingItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => handlePricingItemChange(index, "label", e.target.value)}
                        placeholder="항목명"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step={item.type === "percent" ? "0.01" : "1"}
                          value={item.value}
                          onChange={(e) =>
                            handlePricingItemChange(index, "value", parseFloat(e.target.value) || 0)
                          }
                          placeholder={item.type === "percent" ? "0.1 = 10%" : "금액"}
                          className="flex-1"
                        />
                        <select
                          value={item.type}
                          onChange={(e) => handlePricingItemChange(index, "type", e.target.value)}
                          className="px-3 py-2 border rounded-md bg-background text-sm"
                        >
                          <option value="number">숫자</option>
                          <option value="percent">%</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePricingItem(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addPricingItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="total_amount" className="text-lg font-bold">
                  총 입금 금액
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
                  className="text-lg font-bold"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>이용 유의사항</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_content">유의사항</Label>
                <Textarea
                  id="terms_content"
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  placeholder="템플릿을 선택하면 자동으로 채워집니다"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refund_policy">환불 정책</Label>
                <Textarea
                  id="refund_policy"
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  placeholder="템플릿을 선택하면 자동으로 채워집니다"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contracts")}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "생성 중..." : "계약서 생성 및 링크 복사"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ContractCreate;
