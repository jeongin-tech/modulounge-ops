-- Create contract templates table
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Default pricing
  base_price NUMERIC NOT NULL DEFAULT 340000,
  base_guest_count INTEGER NOT NULL DEFAULT 10,
  additional_price_per_person NUMERIC NOT NULL DEFAULT 25000,
  cleaning_fee NUMERIC NOT NULL DEFAULT 150000,
  vat_rate NUMERIC NOT NULL DEFAULT 0.1,
  
  -- Terms and conditions
  terms_content TEXT NOT NULL,
  refund_policy TEXT NOT NULL,
  
  -- Template settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- STAFF can view all templates
CREATE POLICY "Staff can view all templates"
ON public.contract_templates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'STAFF'));

-- STAFF can create templates
CREATE POLICY "Staff can create templates"
ON public.contract_templates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'STAFF'));

-- STAFF can update templates
CREATE POLICY "Staff can update templates"
ON public.contract_templates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'STAFF'));

-- STAFF can delete templates
CREATE POLICY "Staff can delete templates"
ON public.contract_templates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'STAFF'));

-- Add trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add template_id to contracts table
ALTER TABLE public.contracts
ADD COLUMN template_id UUID REFERENCES contract_templates(id);

-- Insert default template
INSERT INTO public.contract_templates (
  name,
  description,
  base_price,
  base_guest_count,
  additional_price_per_person,
  cleaning_fee,
  vat_rate,
  terms_content,
  refund_policy,
  created_by
) VALUES (
  '기본 계약서',
  '모드라운지 표준 계약서 템플릿',
  340000,
  10,
  25000,
  150000,
  0.1,
  '■ 이용 유의사항

• 벽면에 테이프·접착제 부착 금지 (자국 발생 시 청소비 10만 원 이상 부과)
• 토사물 발생 시 청소비 10만 원 부과
• 전 구역 흡연 금지(전자담배 포함) — 위반 시 CCTV 확인 후 청소비 10만 원 이상 부과
• 내부 기물 및 인테리어 소품 파손 시 수리비 또는 교체비 전액 청구
• 기본 음향 서비스 제공 (기기 보호를 위해 음향 설정은 기본값으로 고정)
• 미성년자는 오후 7시 이후 대관 불가
• 이용 후 남은 물품은 모두 폐기
• 시간 추가(7만 원)는 종료 3시간 전까지 요청
• 입·퇴실 시 CCTV 확인',
  '■ 환불 규정

• 인원 확정 후 인원 조정으로 인한 차액 환불 불가
• 개인 사유(취소·변경 포함)도 동일 규정 적용

환불 기준:
• 결제 완료 ~ 이용일 8일 전: 총 금액의 20% 공제 후 80% 환불
• 이용일 7일 전 ~ 당일: 환불 불가

날짜/지점 변경 규정:
• 이용일 8일 전까지 변경 가능
• 총 금액의 20% 추가 납부 시 이월 가능
• 지점 변경은 해당 일자에 타 지점 예약이 없을 경우만 가능',
  (SELECT id FROM profiles WHERE role = 'STAFF' LIMIT 1)
);