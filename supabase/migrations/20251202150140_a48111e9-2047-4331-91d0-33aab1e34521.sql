-- 가격 규칙 그룹 테이블
CREATE TABLE public.pricing_rule_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 가격 규칙 테이블
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.pricing_rule_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'time_based', 'guest_count', 'option' 등
  condition JSONB, -- 조건 (시간대, 요일, 인원수 등)
  price NUMERIC NOT NULL DEFAULT 0,
  is_percentage BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.pricing_rule_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- pricing_rule_groups 정책
CREATE POLICY "Staff can manage pricing rule groups"
ON public.pricing_rule_groups
FOR ALL
USING (has_role(auth.uid(), 'STAFF'::app_role))
WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Anyone can view active pricing rule groups"
ON public.pricing_rule_groups
FOR SELECT
USING (is_active = true);

-- pricing_rules 정책
CREATE POLICY "Staff can manage pricing rules"
ON public.pricing_rules
FOR ALL
USING (has_role(auth.uid(), 'STAFF'::app_role))
WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Anyone can view active pricing rules"
ON public.pricing_rules
FOR SELECT
USING (is_active = true);

-- 업데이트 트리거
CREATE TRIGGER update_pricing_rule_groups_updated_at
BEFORE UPDATE ON public.pricing_rule_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
BEFORE UPDATE ON public.pricing_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();