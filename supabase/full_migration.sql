-- =====================================================
-- 통합 마이그레이션 SQL 파일
-- 새 Supabase 프로젝트에서 한 번에 실행하세요
-- 생성일: 2024-12-07
-- =====================================================

-- =====================================================
-- PART 1: ENUMS (열거형 타입)
-- =====================================================

-- 사용자 역할 enum
CREATE TYPE public.app_role AS ENUM ('STAFF', 'PARTNER');

-- 주문 상태 enum
CREATE TYPE public.order_status AS ENUM ('requested', 'accepted', 'confirmed', 'completed', 'settled', 'cancelled');


-- =====================================================
-- PART 2: FUNCTIONS (함수) - 테이블 생성 전 필요한 함수
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 역할 확인 함수 (RLS 정책에서 사용)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


-- =====================================================
-- PART 3: TABLES (테이블 생성)
-- =====================================================

-- 1. 사용자 프로필 테이블
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'PARTNER',
  service_type TEXT,
  service_regions JSONB DEFAULT '[]'::jsonb,
  business_registration_number TEXT,
  representative_name TEXT,
  commission_rate NUMERIC,
  slack_webhook_url TEXT,
  slack_channel_id TEXT,
  slack_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.profiles.slack_webhook_url IS 'Slack Incoming Webhook URL for this partner';
COMMENT ON COLUMN public.profiles.slack_channel_id IS 'Slack channel ID for identifying messages from this partner';

-- 2. 사용자 역할 테이블 (보안용 별도 테이블)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. 주문 테이블
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.profiles(id) NOT NULL,
  staff_id UUID REFERENCES public.profiles(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_type TEXT NOT NULL,
  service_date TIMESTAMPTZ NOT NULL,
  service_location TEXT NOT NULL,
  amount DECIMAL(10, 2),
  status order_status NOT NULL DEFAULT 'requested',
  notes TEXT,
  partner_memo TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 주문 첨부파일 테이블
CREATE TABLE public.order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. 정산 테이블
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  partner_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. 메시지 테이블
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sender_name TEXT,
  sender_email TEXT,
  sender_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. 캘린더 이벤트 테이블
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  color TEXT DEFAULT '#3b82f6',
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  visibility TEXT DEFAULT 'default',
  attendees JSONB DEFAULT '[]'::jsonb,
  reminders JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. 캘린더 이벤트 참석자 테이블
CREATE TABLE public.calendar_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT attendee_user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- 9. 계약서 템플릿 테이블
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL DEFAULT 340000,
  base_guest_count INTEGER NOT NULL DEFAULT 10,
  additional_price_per_person NUMERIC NOT NULL DEFAULT 25000,
  cleaning_fee NUMERIC NOT NULL DEFAULT 150000,
  vat_rate NUMERIC NOT NULL DEFAULT 0.1,
  terms_content TEXT NOT NULL,
  refund_policy TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  pricing_items JSONB DEFAULT '[
    {"label": "기본 이용료 (10인 기준)", "field": "base_price"},
    {"label": "인원 추가", "field": "additional_price"},
    {"label": "청소대행", "field": "cleaning_fee"},
    {"label": "부가세", "field": "vat"}
  ]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. 계약서 테이블
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  template_id UUID REFERENCES contract_templates(id),
  
  -- 예약 정보
  location TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  checkin_time TIME NOT NULL,
  checkout_time TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  purpose TEXT,
  
  -- 가격 정보
  base_price NUMERIC NOT NULL DEFAULT 0,
  additional_price NUMERIC NOT NULL DEFAULT 0,
  cleaning_fee NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- 고객 정보
  customer_name TEXT,
  company_name TEXT,
  phone_number TEXT,
  visit_source TEXT,
  tax_invoice_requested BOOLEAN DEFAULT false,
  
  -- 증빙 발행 정보
  receipt_type TEXT,
  cash_receipt_type TEXT,
  business_registration_number TEXT,
  business_name TEXT,
  business_representative TEXT,
  business_address TEXT,
  business_type TEXT,
  business_category TEXT,
  receipt_email TEXT,
  personal_phone TEXT,
  personal_id_number TEXT,
  
  -- 동의 상태
  agreed BOOLEAN DEFAULT false,
  signature_data TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- 고객 접근용 토큰
  access_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. 가격 규칙 그룹 테이블
CREATE TABLE public.pricing_rule_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_type TEXT DEFAULT 'regular',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 12. 가격 규칙 테이블
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.pricing_rule_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  condition JSONB,
  price NUMERIC NOT NULL DEFAULT 0,
  is_percentage BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  months INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12],
  weekdays INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  start_time TIME,
  end_time TIME,
  min_guests INTEGER DEFAULT 1,
  max_guests INTEGER,
  base_guest_count INTEGER DEFAULT 10,
  price_per_additional_guest NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. 알림 테이블
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- =====================================================
-- PART 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PART 5: RLS POLICIES (Row Level Security 정책)
-- =====================================================

-- profiles 정책
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'STAFF'))
  WITH CHECK (has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can delete profiles" ON public.profiles
  FOR DELETE USING (has_role(auth.uid(), 'STAFF'));

-- user_roles 정책
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

-- orders 정책
CREATE POLICY "Partners can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Staff can view all orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can insert orders" ON public.orders
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can update all orders" ON public.orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Partners can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = partner_id);

-- order_files 정책
CREATE POLICY "Users can view files for their orders" ON public.order_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND (orders.partner_id = auth.uid() OR public.has_role(auth.uid(), 'STAFF'))
    )
  );

CREATE POLICY "Users can upload files for their orders" ON public.order_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_files.order_id
      AND (orders.partner_id = auth.uid() OR public.has_role(auth.uid(), 'STAFF'))
    )
  );

-- settlements 정책
CREATE POLICY "Partners can view their own settlements" ON public.settlements
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Staff can view all settlements" ON public.settlements
  FOR SELECT USING (public.has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can manage settlements" ON public.settlements
  FOR ALL USING (public.has_role(auth.uid(), 'STAFF'));

-- messages 정책
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    public.has_role(auth.uid(), 'STAFF')
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- calendar_events 정책
CREATE POLICY "Partners can view their own calendar events" ON calendar_events
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Users can create calendar events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own calendar events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- calendar_event_attendees 정책
CREATE POLICY "Users can view attendees of their events" ON calendar_event_attendees
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = calendar_event_attendees.event_id
      AND (calendar_events.created_by = auth.uid() OR has_role(auth.uid(), 'STAFF'))
    )
  );

CREATE POLICY "Event creators can manage attendees" ON public.calendar_event_attendees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE calendar_events.id = calendar_event_attendees.event_id
      AND calendar_events.created_by = auth.uid()
    )
  );

-- contracts 정책 (익명 접근 허용)
CREATE POLICY "anon_select_contracts" ON public.contracts
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_contracts" ON public.contracts
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "staff_all_contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'STAFF'::app_role))
  WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

-- contract_templates 정책
CREATE POLICY "anon_select_templates" ON public.contract_templates
  FOR SELECT TO anon USING (true);

CREATE POLICY "staff_all_templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'STAFF'::app_role))
  WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

-- pricing_rule_groups 정책
CREATE POLICY "Staff can manage pricing rule groups" ON public.pricing_rule_groups
  FOR ALL USING (has_role(auth.uid(), 'STAFF'::app_role))
  WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Anyone can view active pricing rule groups" ON public.pricing_rule_groups
  FOR SELECT USING (is_active = true);

-- pricing_rules 정책
CREATE POLICY "Staff can manage pricing rules" ON public.pricing_rules
  FOR ALL USING (has_role(auth.uid(), 'STAFF'::app_role))
  WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Anyone can view active pricing rules" ON public.pricing_rules
  FOR SELECT USING (is_active = true);

-- notifications 정책
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);


-- =====================================================
-- PART 6: TRIGGERS (트리거)
-- =====================================================

-- updated_at 트리거들
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rule_groups_updated_at
  BEFORE UPDATE ON public.pricing_rule_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 신규 사용자 처리 함수 및 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- raw_user_meta_data에서 role 가져오기 (기본값: PARTNER)
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role, 
    'PARTNER'::public.app_role
  );

  -- profiles 테이블에 삽입
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_name,
    phone,
    role,
    service_type,
    service_regions,
    business_registration_number,
    representative_name
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    user_role,
    NEW.raw_user_meta_data->>'service_type',
    COALESCE(NEW.raw_user_meta_data->'service_regions', '[]'::jsonb),
    NEW.raw_user_meta_data->>'business_registration_number',
    NEW.raw_user_meta_data->>'representative_name'
  );

  -- user_roles 테이블에 삽입
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- 신규 사용자 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- PART 7: INDEXES (인덱스)
-- =====================================================

CREATE INDEX idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_service_date ON public.orders(service_date);
CREATE INDEX idx_messages_order_id ON public.messages(order_id);
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_event_attendees_event_id ON public.calendar_event_attendees(event_id);
CREATE INDEX idx_calendar_event_attendees_user_id ON public.calendar_event_attendees(user_id);
CREATE INDEX idx_profiles_slack_user_id ON public.profiles(slack_user_id) WHERE slack_user_id IS NOT NULL;
CREATE INDEX idx_pricing_rule_groups_profile_id ON public.pricing_rule_groups(profile_id);
CREATE INDEX idx_pricing_rules_group_id ON public.pricing_rules(group_id);


-- =====================================================
-- PART 8: REALTIME (실시간 기능)
-- =====================================================

-- messages 테이블 실시간 활성화
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- notifications 테이블 실시간 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- =====================================================
-- PART 9: STORAGE (스토리지 버킷)
-- =====================================================

-- order-files 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책
CREATE POLICY "Users can upload order files" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view order files" ON storage.objects 
  FOR SELECT USING (bucket_id = 'order-files');

CREATE POLICY "Users can delete their own order files" ON storage.objects 
  FOR DELETE USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);


-- =====================================================
-- PART 10: DEFAULT DATA (기본 데이터) - 선택사항
-- =====================================================

-- 참고: 기본 계약서 템플릿은 STAFF 사용자가 생성된 후에 추가해야 합니다.
-- 아래는 예시입니다. 실제로는 STAFF 사용자 ID로 교체해야 합니다.
/*
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
  'YOUR_STAFF_USER_UUID_HERE'
);
*/


-- =====================================================
-- 완료! 
-- 이 SQL을 새 Supabase 프로젝트의 SQL Editor에서 실행하세요.
-- =====================================================
