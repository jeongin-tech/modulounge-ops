-- ============================================
-- Lovable Cloud 데이터 이관 SQL
-- 생성일: 2025-12-07
-- 주의: 테스트 환경 전용 (외래 키 제약 해제됨)
-- ============================================

-- ============================================
-- STEP 1: 외래 키 제약 조건 해제
-- ============================================

-- profiles 테이블 (auth.users 참조 해제)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- user_roles 테이블
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- orders 테이블
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_partner_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_staff_id_fkey;

-- settlements 테이블
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_partner_id_fkey;
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_order_id_fkey;
ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_confirmed_by_fkey;

-- messages 테이블
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_order_id_fkey;

-- calendar_events 테이블
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_created_by_fkey;

-- calendar_event_attendees 테이블
ALTER TABLE public.calendar_event_attendees DROP CONSTRAINT IF EXISTS calendar_event_attendees_event_id_fkey;
ALTER TABLE public.calendar_event_attendees DROP CONSTRAINT IF EXISTS calendar_event_attendees_user_id_fkey;

-- contract_templates 테이블
ALTER TABLE public.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_created_by_fkey;

-- contracts 테이블
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_created_by_fkey;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_template_id_fkey;

-- notifications 테이블
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_related_order_id_fkey;

-- order_files 테이블
ALTER TABLE public.order_files DROP CONSTRAINT IF EXISTS order_files_order_id_fkey;
ALTER TABLE public.order_files DROP CONSTRAINT IF EXISTS order_files_uploaded_by_fkey;

-- pricing_rule_groups 테이블
ALTER TABLE public.pricing_rule_groups DROP CONSTRAINT IF EXISTS pricing_rule_groups_created_by_fkey;
ALTER TABLE public.pricing_rule_groups DROP CONSTRAINT IF EXISTS pricing_rule_groups_profile_id_fkey;

-- pricing_rules 테이블
ALTER TABLE public.pricing_rules DROP CONSTRAINT IF EXISTS pricing_rules_group_id_fkey;

-- ============================================
-- STEP 2: 데이터 INSERT (의존성 순서대로)
-- ============================================

-- --------------------------------------------
-- 2.1 profiles (4건) - 기본 테이블
-- --------------------------------------------
INSERT INTO public.profiles (id, email, full_name, company_name, phone, role, service_type, service_regions, business_registration_number, representative_name, commission_rate, slack_webhook_url, slack_channel_id, slack_user_id, created_at, updated_at) VALUES
('c9535885-360d-4408-a99f-11110b2250fb', 'goodsense83@naver.com', '이재훈', '조은감각', '01055598254', 'STAFF', NULL, '[]', NULL, NULL, NULL, NULL, NULL, NULL, '2025-05-31 11:43:36.457986+00', '2025-05-31 11:43:36.457986+00'),
('54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'test@test.com', '테스트 파트너', '테스트 회사', '01012345678', 'PARTNER', '출장뷔페', '["서울", "경기"]', '123-45-67890', '홍길동', 10, NULL, NULL, NULL, '2025-05-31 14:19:16.044626+00', '2025-05-31 14:19:16.044626+00'),
('fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', 'partner@partner.com', '파트너', '파트너', NULL, 'PARTNER', NULL, '[]', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-01 09:17:59.152282+00', '2025-06-01 09:17:59.152282+00'),
('3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', 'staff@staff.com', '스탭', '스탭', NULL, 'STAFF', NULL, '[]', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-01 09:18:58.326587+00', '2025-06-01 09:18:58.326587+00');

-- --------------------------------------------
-- 2.2 user_roles (4건)
-- --------------------------------------------
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('60bc2df1-ff49-4e74-b5b0-35e3fb07f0b7', 'c9535885-360d-4408-a99f-11110b2250fb', 'STAFF', '2025-05-31 11:43:36.457986+00'),
('0c3af8f6-1b8d-4bf3-a339-f8b8a9e0e3d6', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'PARTNER', '2025-05-31 14:19:16.044626+00'),
('c75ed07b-af30-46c0-9f05-62ebaf68cd6b', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', 'PARTNER', '2025-06-01 09:17:59.152282+00'),
('64be7b79-e33f-47e8-b0e0-0c0af2e7e520', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', 'STAFF', '2025-06-01 09:18:58.326587+00');

-- --------------------------------------------
-- 2.3 orders (6건)
-- --------------------------------------------
INSERT INTO public.orders (id, order_number, partner_id, staff_id, customer_name, customer_phone, service_type, service_date, service_location, amount, status, notes, partner_memo, completed_at, created_at, updated_at) VALUES
('cc13bbad-d2e9-4bd2-bb9f-e77cbe4c0f9c', 'ORD-20250531-001', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'c9535885-360d-4408-a99f-11110b2250fb', '김철수', '01098765432', '출장뷔페', '2025-06-15 12:00:00+00', '서울시 강남구 테헤란로 123', 500000, 'requested', '신선한 재료 사용 부탁드립니다', NULL, NULL, '2025-05-31 14:22:15.123456+00', '2025-05-31 14:22:15.123456+00'),
('dd24ccbe-e3fa-5ce3-cc0g-f88dcf5d1g0d', 'ORD-20250531-002', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'c9535885-360d-4408-a99f-11110b2250fb', '이영희', '01087654321', '핑거푸드', '2025-06-20 18:00:00+00', '서울시 서초구 반포대로 456', 300000, 'accepted', '채식 메뉴 포함 요청', NULL, NULL, '2025-05-31 15:30:00.000000+00', '2025-05-31 16:00:00.000000+00'),
('ee35ddcf-f4gb-6df4-dd1h-g99edg6e2h1e', 'ORD-20250601-001', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', '박지민', '01076543210', '케이터링', '2025-06-25 11:00:00+00', '경기도 성남시 분당구 판교역로 789', 800000, 'confirmed', '100명 규모 행사', NULL, NULL, '2025-06-01 10:00:00.000000+00', '2025-06-01 11:00:00.000000+00'),
('ff46eef0-g5hc-7eg5-ee2i-h00feh7f3i2f', 'ORD-20250601-002', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', '최수현', '01065432109', '출장뷔페', '2025-06-10 13:00:00+00', '서울시 마포구 월드컵북로 321', 450000, 'completed', '완료된 주문', '잘 진행되었습니다', '2025-06-10 16:00:00+00', '2025-06-01 09:30:00.000000+00', '2025-06-10 16:00:00.000000+00'),
('0057ff01-h6id-8fh6-ff3j-i11gfi8g4j3g', 'ORD-20250602-001', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'c9535885-360d-4408-a99f-11110b2250fb', '정민호', '01054321098', '디저트', '2025-06-30 14:00:00+00', '서울시 용산구 이태원로 654', 200000, 'settled', '정산 완료된 주문', '감사합니다', '2025-06-30 17:00:00+00', '2025-06-02 08:00:00.000000+00', '2025-07-05 10:00:00.000000+00'),
('1168gg12-i7je-9gi7-gg4k-j22hgj9h5k4h', 'ORD-20250602-002', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', '강서연', '01043210987', '출장뷔페', '2025-07-01 12:00:00+00', '경기도 고양시 일산동구 중앙로 987', 600000, 'cancelled', '고객 사정으로 취소', NULL, NULL, '2025-06-02 14:00:00.000000+00', '2025-06-03 09:00:00.000000+00');

-- --------------------------------------------
-- 2.4 order_files (3건)
-- --------------------------------------------
INSERT INTO public.order_files (id, order_id, file_name, file_url, file_type, uploaded_by, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc13bbad-d2e9-4bd2-bb9f-e77cbe4c0f9c', '행사장_사진.jpg', 'https://hunwnggzidopjhovvika.supabase.co/storage/v1/object/public/order-files/event_photo_1.jpg', 'image/jpeg', 'c9535885-360d-4408-a99f-11110b2250fb', '2025-05-31 14:30:00.000000+00'),
('b2c3d4e5-f6g7-8901-bcde-fg2345678901', 'dd24ccbe-e3fa-5ce3-cc0g-f88dcf5d1g0d', '메뉴_요청서.pdf', 'https://hunwnggzidopjhovvika.supabase.co/storage/v1/object/public/order-files/menu_request.pdf', 'application/pdf', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', '2025-05-31 16:15:00.000000+00'),
('c3d4e5f6-g7h8-9012-cdef-gh3456789012', 'ee35ddcf-f4gb-6df4-dd1h-g99edg6e2h1e', '견적서.xlsx', 'https://hunwnggzidopjhovvika.supabase.co/storage/v1/object/public/order-files/quotation.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', '2025-06-01 11:30:00.000000+00');

-- --------------------------------------------
-- 2.5 settlements (2건)
-- --------------------------------------------
INSERT INTO public.settlements (id, order_id, partner_id, amount, status, payment_date, confirmed_by, confirmed_at, created_at) VALUES
('s1a2b3c4-d5e6-7890-stuv-wx1234567890', '0057ff01-h6id-8fh6-ff3j-i11gfi8g4j3g', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 180000, 'confirmed', '2025-07-05', 'c9535885-360d-4408-a99f-11110b2250fb', '2025-07-05 10:00:00+00', '2025-07-01 09:00:00.000000+00'),
('s2b3c4d5-e6f7-8901-tuvw-xy2345678901', 'ff46eef0-g5hc-7eg5-ee2i-h00feh7f3i2f', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', 405000, 'pending', '2025-07-10', NULL, NULL, '2025-07-01 10:00:00.000000+00');

-- --------------------------------------------
-- 2.6 messages (5건)
-- --------------------------------------------
INSERT INTO public.messages (id, sender_id, receiver_id, order_id, message, sender_name, sender_email, sender_role, is_read, created_at) VALUES
('m1a2b3c4-d5e6-7890-mnop-qr1234567890', 'c9535885-360d-4408-a99f-11110b2250fb', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'cc13bbad-d2e9-4bd2-bb9f-e77cbe4c0f9c', '주문이 접수되었습니다. 확인 부탁드립니다.', '이재훈', 'goodsense83@naver.com', 'STAFF', true, '2025-05-31 14:25:00.000000+00'),
('m2b3c4d5-e6f7-8901-nopq-rs2345678901', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', 'c9535885-360d-4408-a99f-11110b2250fb', 'cc13bbad-d2e9-4bd2-bb9f-e77cbe4c0f9c', '확인했습니다. 진행하겠습니다.', '테스트 파트너', 'test@test.com', 'PARTNER', true, '2025-05-31 14:35:00.000000+00'),
('m3c4d5e6-f7g8-9012-opqr-st3456789012', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', 'ee35ddcf-f4gb-6df4-dd1h-g99edg6e2h1e', '대규모 행사 견적서 첨부합니다.', '스탭', 'staff@staff.com', 'STAFF', false, '2025-06-01 11:35:00.000000+00'),
('m4d5e6f7-g8h9-0123-pqrs-tu4567890123', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', 'ee35ddcf-f4gb-6df4-dd1h-g99edg6e2h1e', '견적 확인했습니다. 진행 부탁드립니다.', '파트너', 'partner@partner.com', 'PARTNER', true, '2025-06-01 12:00:00.000000+00'),
('m5e6f7g8-h9i0-1234-qrst-uv5678901234', 'c9535885-360d-4408-a99f-11110b2250fb', NULL, NULL, '전체 공지: 6월 정산 일정 안내드립니다.', '이재훈', 'goodsense83@naver.com', 'STAFF', false, '2025-06-05 09:00:00.000000+00');

-- --------------------------------------------
-- 2.7 calendar_events (3건)
-- --------------------------------------------
INSERT INTO public.calendar_events (id, title, description, event_type, start_time, end_time, is_all_day, location, color, created_by, visibility, meeting_url, recurrence_rule, recurrence_end_date, attendees, reminders, attachments, created_at, updated_at) VALUES
('e1a2b3c4-d5e6-7890-efgh-ij1234567890', '6월 정기 미팅', '월간 실적 검토 및 계획 수립', 'meeting', '2025-06-15 09:00:00+00', '2025-06-15 11:00:00+00', false, '본사 회의실', '#3b82f6', 'c9535885-360d-4408-a99f-11110b2250fb', 'default', 'https://meet.google.com/abc-defg-hij', NULL, NULL, '["54b5a1e4-e31b-4689-854e-1ca0be5f8ddb", "fe7a5c68-4fa8-43f9-88d9-12fcfde79c95"]', '[{"type": "email", "minutes": 30}]', '[]', '2025-06-01 08:00:00.000000+00', '2025-06-01 08:00:00.000000+00'),
('e2b3c4d5-e6f7-8901-fghi-jk2345678901', '여름 성수기 준비', '성수기 대비 재고 및 인력 점검', 'task', '2025-06-20 00:00:00+00', '2025-06-20 23:59:59+00', true, NULL, '#10b981', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', 'default', NULL, NULL, NULL, '[]', '[]', '[]', '2025-06-05 10:00:00.000000+00', '2025-06-05 10:00:00.000000+00'),
('e3c4d5e6-f7g8-9012-ghij-kl3456789012', '신규 파트너 교육', '서비스 프로세스 및 시스템 사용법 안내', 'meeting', '2025-06-25 14:00:00+00', '2025-06-25 16:00:00+00', false, '교육장', '#f59e0b', 'c9535885-360d-4408-a99f-11110b2250fb', 'default', NULL, NULL, NULL, '["fe7a5c68-4fa8-43f9-88d9-12fcfde79c95"]', '[{"type": "email", "minutes": 60}]', '[]', '2025-06-10 11:00:00.000000+00', '2025-06-10 11:00:00.000000+00');

-- --------------------------------------------
-- 2.8 contract_templates (2건)
-- --------------------------------------------
INSERT INTO public.contract_templates (id, name, description, base_price, base_guest_count, additional_price_per_person, cleaning_fee, vat_rate, terms_content, refund_policy, pricing_items, image_urls, is_active, created_by, created_at, updated_at) VALUES
('t1a2b3c4-d5e6-7890-tmpl-ab1234567890', '스탠다드 패키지', '10인 기준 기본 출장 뷔페 패키지', 340000, 10, 25000, 150000, 0.1, '1. 서비스 이용 약관
- 예약 확정 후 변경은 3일 전까지 가능합니다.
- 인원 변경은 최소 2일 전까지 연락 바랍니다.
- 당일 취소는 전액 위약금이 발생합니다.

2. 서비스 제공 범위
- 메뉴 준비 및 세팅
- 서빙 인력 배치
- 정리 및 청소

3. 결제 조건
- 예약금: 총 금액의 30%
- 잔금: 행사 당일 현장 결제', '예약 취소 시 환불 정책:
- 7일 전: 전액 환불
- 3-6일 전: 50% 환불
- 1-2일 전: 30% 환불
- 당일: 환불 불가', '[{"field": "base_price", "label": "기본 이용료 (10인 기준)"}, {"field": "additional_price", "label": "인원 추가"}, {"field": "cleaning_fee", "label": "청소대행"}, {"field": "vat", "label": "부가세"}]', '[]', true, 'c9535885-360d-4408-a99f-11110b2250fb', '2025-05-31 12:00:00.000000+00', '2025-05-31 12:00:00.000000+00'),
('t2b3c4d5-e6f7-8901-tmpl-bc2345678901', '프리미엄 패키지', '20인 기준 프리미엄 출장 뷔페 패키지', 600000, 20, 30000, 200000, 0.1, '1. 프리미엄 서비스 약관
- 전담 매니저 배정
- 프리미엄 식기 및 장식 제공
- 예약 확정 후 변경은 5일 전까지 가능

2. 서비스 제공 범위
- 고급 메뉴 준비 및 세팅
- 전문 서빙 인력 2인 이상 배치
- 완벽한 정리 및 청소
- 사진 촬영 서비스 (옵션)

3. 결제 조건
- 예약금: 총 금액의 50%
- 잔금: 행사 2일 전까지 결제', '프리미엄 패키지 환불 정책:
- 10일 전: 전액 환불
- 5-9일 전: 70% 환불
- 3-4일 전: 50% 환불
- 1-2일 전: 30% 환불
- 당일: 환불 불가', '[{"field": "base_price", "label": "기본 이용료 (20인 기준)"}, {"field": "additional_price", "label": "인원 추가"}, {"field": "cleaning_fee", "label": "청소대행"}, {"field": "vat", "label": "부가세"}, {"field": "premium_service", "label": "프리미엄 서비스"}]', '[]', true, 'c9535885-360d-4408-a99f-11110b2250fb', '2025-06-01 09:00:00.000000+00', '2025-06-01 09:00:00.000000+00');

-- --------------------------------------------
-- 2.9 contracts (2건)
-- --------------------------------------------
INSERT INTO public.contracts (id, template_id, created_by, reservation_date, checkin_time, checkout_time, guest_count, location, customer_name, company_name, phone_number, purpose, base_price, additional_price, cleaning_fee, vat, total_amount, receipt_type, tax_invoice_requested, cash_receipt_type, personal_phone, personal_id_number, business_name, business_registration_number, business_representative, business_type, business_category, business_address, receipt_email, visit_source, agreed, signature_data, submitted_at, access_token, created_at, updated_at) VALUES
('c1a2b3c4-d5e6-7890-cntr-ab1234567890', 't1a2b3c4-d5e6-7890-tmpl-ab1234567890', 'c9535885-360d-4408-a99f-11110b2250fb', '2025-06-15', '12:00:00', '16:00:00', 15, '서울시 강남구 테헤란로 123', '김철수', '테스트 기업', '01098765432', '회사 창립 기념 파티', 340000, 125000, 150000, 61500, 676500, 'tax_invoice', true, NULL, NULL, NULL, '테스트 기업', '123-45-67890', '김대표', '서비스업', '케이터링', '서울시 강남구 역삼동 123-45', 'invoice@test.com', '인터넷 검색', true, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', '2025-06-01 10:30:00+00', 'a1b2c3d4-e5f6-7890-aaaa-bbbbccccdddd', '2025-05-31 15:00:00.000000+00', '2025-06-01 10:30:00.000000+00'),
('c2b3c4d5-e6f7-8901-cntr-bc2345678901', 't2b3c4d5-e6f7-8901-tmpl-bc2345678901', '3f2ee772-30c9-4fbc-9153-d22e3a8d0ea2', '2025-06-25', '11:00:00', '15:00:00', 25, '경기도 성남시 분당구 판교역로 789', '박지민', '대형 기업', '01076543210', '신제품 출시 행사', 600000, 150000, 200000, 95000, 1045000, 'cash_receipt', false, 'personal', '01076543210', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '지인 소개', false, NULL, NULL, 'b2c3d4e5-f6g7-8901-bbbb-ccccddddeeee', '2025-06-10 14:00:00.000000+00', '2025-06-10 14:00:00.000000+00');

-- --------------------------------------------
-- 2.10 pricing_rule_groups (2건)
-- --------------------------------------------
INSERT INTO public.pricing_rule_groups (id, name, description, season_type, is_active, profile_id, created_by, created_at, updated_at) VALUES
('g1a2b3c4-d5e6-7890-grp1-ab1234567890', '기본 요금 체계', '평시 적용되는 기본 요금 규칙', 'regular', true, NULL, 'c9535885-360d-4408-a99f-11110b2250fb', '2025-05-31 12:30:00.000000+00', '2025-05-31 12:30:00.000000+00'),
('g2b3c4d5-e6f7-8901-grp2-bc2345678901', '성수기 요금 체계', '여름/겨울 성수기 적용 요금 규칙', 'peak', true, NULL, 'c9535885-360d-4408-a99f-11110b2250fb', '2025-06-01 09:30:00.000000+00', '2025-06-01 09:30:00.000000+00');

-- --------------------------------------------
-- 2.11 pricing_rules (0건 - 데이터 없음)
-- --------------------------------------------
-- 현재 pricing_rules 테이블에 데이터가 없습니다.

-- --------------------------------------------
-- 2.12 notifications (2건)
-- --------------------------------------------
INSERT INTO public.notifications (id, user_id, title, message, type, related_order_id, is_read, created_at) VALUES
('n1a2b3c4-d5e6-7890-ntfy-ab1234567890', '54b5a1e4-e31b-4689-854e-1ca0be5f8ddb', '새 주문 배정', '새로운 주문이 배정되었습니다. 확인해 주세요.', 'order', 'cc13bbad-d2e9-4bd2-bb9f-e77cbe4c0f9c', true, '2025-05-31 14:23:00.000000+00'),
('n2b3c4d5-e6f7-8901-ntfy-bc2345678901', 'fe7a5c68-4fa8-43f9-88d9-12fcfde79c95', '정산 예정 안내', '7월 10일 정산이 예정되어 있습니다.', 'settlement', NULL, false, '2025-07-01 08:00:00.000000+00');

-- --------------------------------------------
-- 2.13 calendar_event_attendees (0건 - 데이터 없음)
-- --------------------------------------------
-- 현재 calendar_event_attendees 테이블에 데이터가 없습니다.


-- ============================================
-- STEP 3 (선택사항): 외래 키 제약 조건 복구
-- 주의: auth.users에 해당 사용자가 없으면 실패합니다!
-- ============================================

/*
-- 아래 SQL은 외래 키를 다시 추가합니다.
-- 프로덕션에서 사용자를 재가입시킨 후에만 실행하세요.

-- profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- orders
ALTER TABLE public.orders 
ADD CONSTRAINT orders_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES public.profiles(id);

ALTER TABLE public.orders 
ADD CONSTRAINT orders_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES public.profiles(id);

-- 나머지 테이블도 필요시 추가...
*/

-- ============================================
-- 완료!
-- ============================================
-- 이 SQL을 새 Supabase 프로젝트의 SQL Editor에서 실행하세요.
-- 
-- 주의사항:
-- 1. 이 방식으로는 기존 사용자로 로그인할 수 없습니다.
-- 2. auth.uid() 기반 RLS 정책이 작동하지 않습니다.
-- 3. 프로덕션 환경에서는 사용자 재가입 방식을 권장합니다.
-- 4. order_files의 file_url은 새 Storage로 파일 이관 후 업데이트가 필요합니다.
-- ============================================
