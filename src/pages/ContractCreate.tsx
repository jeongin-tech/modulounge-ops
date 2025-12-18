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

interface Template {
  id: string;
  name: string;
  pricing_items: PricingItem[];
}

const DEFAULT_PRICING_ITEMS: PricingItem[] = [
  { label: "기본 이용료", value: 0, type: "number" },
  { label: "기본 인원", value: 0, type: "number" },
  { label: "인당 추가 요금", value: 0, type: "number" },
  { label: "청소대행비", value: 0, type: "number" },
  { label: "부가세율", value: 0, type: "percent" },
];

const ContractCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [pricingItems, setPricingItems] = useState<PricingItem[]>(DEFAULT_PRICING_ITEMS);
  const [formData, setFormData] = useState({
    location: "",
    reservation_date: "",
    checkin_time: "",
    checkout_time: "",
    guest_count: 0,
    purpose: "",
    base_price: 0,
    additional_price: 0,
    cleaning_fee: 0,
    vat: 0,
    total_amount: 0,
  });

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
    
    setFormData(prev => ({
      ...prev,
      total_amount: total,
    }));
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
            location: formData.location,
            reservation_date: formData.reservation_date,
            checkin_time: formData.checkin_time,
            checkout_time: formData.checkout_time,
            guest_count: formData.guest_count,
            purpose: formData.purpose,
            base_price: basePrice,
            additional_price: pricingItems[2]?.value || 0,
            cleaning_fee: cleaningFee,
            vat: vat,
            total_amount: formData.total_amount,
            template_id: selectedTemplate || null,
            created_by: user.id,
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">예약호실</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservation_date">예약 날짜</Label>
                  <Input
                    id="reservation_date"
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) =>
                      setFormData({ ...formData, reservation_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkin_time">입실 시간</Label>
                  <Input
                    id="checkin_time"
                    type="time"
                    value={formData.checkin_time}
                    onChange={(e) =>
                      setFormData({ ...formData, checkin_time: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout_time">퇴실 시간</Label>
                  <Input
                    id="checkout_time"
                    type="time"
                    value={formData.checkout_time}
                    onChange={(e) =>
                      setFormData({ ...formData, checkout_time: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_count">이용 인원</Label>
                  <Input
                    id="guest_count"
                    type="number"
                    value={formData.guest_count}
                    onChange={(e) =>
                      setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purpose">이용 목적</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    placeholder="선택사항"
                  />
                </div>
              </div>
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
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-lg font-bold"
                  required
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
