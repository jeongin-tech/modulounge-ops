import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { loungeImages } from "@/lib/loungeImages";
import logo from "@/assets/logo.jpg";

interface Contract {
  id: string;
  location: string;
  reservation_date: string;
  checkin_time: string;
  checkout_time: string;
  guest_count: number;
  purpose: string | null;
  base_price: number;
  additional_price: number;
  cleaning_fee: number;
  vat: number;
  total_amount: number;
  agreed: boolean;
  submitted_at: string | null;
  template_id: string | null;
  contract_templates: {
    terms_content: string;
    refund_policy: string;
    image_urls: any;
    pricing_items: any;
  } | null;
}

const ContractResponse = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    company_name: "",
    phone_number: "",
    visit_source: "",
    tax_invoice_requested: false,
    agreed: false,
  });

  useEffect(() => {
    fetchContract();
  }, [token]);

  const fetchContract = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          contract_templates (
            terms_content,
            refund_policy,
            image_urls,
            pricing_items
          )
        `)
        .eq("access_token", token)
        .single();

      if (error) throw error;
      
      if (data.submitted_at) {
        toast.info("이미 제출된 계약서입니다.");
      }
      
      setContract(data);
    } catch (error) {
      console.error("계약서 조회 오류:", error);
      toast.error("계약서를 찾을 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreed) {
      toast.error("유의사항 및 환불 규정에 동의해주세요.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL();
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          customer_name: formData.customer_name,
          company_name: formData.company_name || null,
          phone_number: formData.phone_number,
          visit_source: formData.visit_source,
          tax_invoice_requested: formData.tax_invoice_requested,
          agreed: formData.agreed,
          signature_data: signatureData,
          submitted_at: new Date().toISOString(),
        })
        .eq("access_token", token);

      if (error) throw error;

      toast.success("계약서가 제출되었습니다!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("계약서 제출 오류:", error);
      toast.error("제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">계약서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (contract.submitted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">계약서가 제출되었습니다</h2>
            <p className="text-muted-foreground">
              {format(new Date(contract.submitted_at), "yyyy년 MM월 dd일 HH:mm")}에 제출됨
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={logo} alt="모드라운지" className="h-16 w-16 mx-auto rounded-full" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            모드라운지 계약서
          </h1>
          <p className="text-muted-foreground">
            모드라운지는 무인 운영되는 공간입니다.
          </p>
        </div>

        {/* Lounge Images */}
        {contract.contract_templates?.image_urls && 
         Array.isArray(contract.contract_templates.image_urls) && 
         contract.contract_templates.image_urls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.contract_templates.image_urls.map((imageId: string, idx: number) => {
              const imageSrc = loungeImages[imageId];
              return imageSrc ? (
                <img
                  key={idx}
                  src={imageSrc}
                  alt={`모드라운지 내부 ${idx + 1}`}
                  className="rounded-lg w-full object-cover h-48"
                />
              ) : null;
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src={loungeImages["lounge-1"]}
              alt="모드라운지 내부"
              className="rounded-lg w-full object-cover h-48"
            />
            <img
              src={loungeImages["lounge-2"]}
              alt="모드라운지 내부"
              className="rounded-lg w-full object-cover h-48"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract Terms */}
          <Card>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-lg mb-2">■ 이용 유의사항</h3>
                <div className="text-muted-foreground whitespace-pre-line">
                  {contract.contract_templates?.terms_content || 
                    `• 벽면에 테이프·접착제 부착 금지 (자국 발생 시 청소비 10만 원 이상 부과)
• 토사물 발생 시 청소비 10만 원 부과
• 전 구역 흡연 금지(전자담배 포함) — 위반 시 CCTV 확인 후 청소비 10만 원 이상 부과
• 내부 기물 및 인테리어 소품 파손 시 수리비 또는 교체비 전액 청구
• 기본 음향 서비스 제공
• 미성년자는 오후 7시 이후 대관 불가
• 이용 후 남은 물품은 모두 폐기
• 입·퇴실 시 CCTV 확인`}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">■ 환불 규정</h3>
                <div className="text-muted-foreground whitespace-pre-line">
                  {contract.contract_templates?.refund_policy || 
                    `• 결제 완료 ~ 이용일 8일 전: 총 금액의 20% 공제 후 80% 환불
• 이용일 7일 전 ~ 당일: 환불 불가
• 이용일 8일 전까지 날짜/지점 변경 가능 (총 금액의 20% 추가 납부 시 이월 가능)`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-lg">■ 예약 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">예약호실</p>
                  <p className="font-medium">{contract.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">예약 날짜</p>
                  <p className="font-medium">
                    {format(new Date(contract.reservation_date), "MM월 dd일 (E)", { locale: require("date-fns/locale/ko") })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">입실 시간</p>
                  <p className="font-medium">{contract.checkin_time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">퇴실 시간</p>
                  <p className="font-medium">{contract.checkout_time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">이용 인원</p>
                  <p className="font-medium">{contract.guest_count}명</p>
                </div>
                {contract.purpose && (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">이용 목적</p>
                    <p className="font-medium">{contract.purpose}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <h3 className="font-bold text-lg mb-4">■ 이용 요금</h3>
              <div className="space-y-2 text-sm">
                {contract.contract_templates?.pricing_items && 
                 Array.isArray(contract.contract_templates.pricing_items) ? (
                  contract.contract_templates.pricing_items.map((item: any, idx: number) => {
                    const fieldMap: Record<string, number> = {
                      base_price: contract.base_price,
                      additional_price: contract.additional_price,
                      cleaning_fee: contract.cleaning_fee,
                      vat: contract.vat,
                    };
                    const amount = fieldMap[item.field] || 0;
                    return (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{amount.toLocaleString()}원</span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">기본 이용료(10인 기준)</span>
                      <span className="font-medium">{contract.base_price.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">인원 추가</span>
                      <span className="font-medium">{contract.additional_price.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">청소대행</span>
                      <span className="font-medium">{contract.cleaning_fee.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">부가세</span>
                      <span className="font-medium">{contract.vat.toLocaleString()}원</span>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t flex justify-between text-lg">
                  <span className="font-bold">▶ 총 입금 금액</span>
                  <span className="font-bold text-primary">{contract.total_amount.toLocaleString()}원</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Form */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-lg">■ 고객 정보 입력</h3>
              
              <div className="space-y-2">
                <Label htmlFor="tax_invoice">증빙 발행 요청</Label>
                <RadioGroup
                  value={formData.tax_invoice_requested ? "Y" : "N"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tax_invoice_requested: value === "Y" })
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Y" id="tax-yes" />
                      <Label htmlFor="tax-yes">예</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="N" id="tax-no" />
                      <Label htmlFor="tax-no">아니오</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_source">방문 경로</Label>
                <Textarea
                  id="visit_source"
                  value={formData.visit_source}
                  onChange={(e) =>
                    setFormData({ ...formData, visit_source: e.target.value })
                  }
                  placeholder="저희 공간을 어떤 경로를 통해 알게 되셨나요? 검색어 포함하여 작성해 주세요."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">예약자 성함 *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">기업 대관 시 기업명 & 위치</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="해당 시 작성"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">핸드폰 번호 *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="010-0000-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>서명 *</Label>
                <div className="border rounded-md p-2 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full border rounded cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="mt-2"
                  >
                    서명 지우기
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-4">
                <Checkbox
                  id="agreed"
                  checked={formData.agreed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreed: checked === true })
                  }
                />
                <Label htmlFor="agreed" className="leading-tight cursor-pointer">
                  유의사항 및 환불 규정에 동의합니다 *
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={submitting || !formData.agreed}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {submitting ? "제출 중..." : "계약서 작성하기"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>회원가입 안내</p>
          <p className="mt-1">
            예약 전일에 발송되는 대관 메시지 수신을 위해 회원가입이 반드시 필요합니다.
          </p>
          <a
            href="https://modlounge.co.kr/site_join_type_choice?back_url=Lw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline mt-2 inline-block"
          >
            👉 회원가입 바로가기
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContractResponse;
