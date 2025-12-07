# 모드라운지 ADMIN 시스템 - Next.js 마이그레이션 상세 명세서

## 프로젝트 개요

**모드라운지 ADMIN**은 공간 대관 서비스를 위한 B2B 관리 시스템입니다. 
- **내부직원(STAFF)**: 오더 생성, 전체 관리, 정산, 계약서 관리
- **제휴업체(PARTNER)**: 오더 수락/거절, 완료 처리, 정산 확인

---

## 1. 기술 스택

### 현재 (React + Vite)
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui 컴포넌트
- Supabase (Auth, Database, Storage, Edge Functions)
- React Router DOM
- TanStack Query
- date-fns (날짜 처리)
- Sonner (토스트 알림)
- Lucide React (아이콘)

### Next.js 마이그레이션 권장 스택
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (동일)
- Server Actions / API Routes
- next-auth 또는 Supabase Auth

---

## 2. 데이터베이스 스키마

### 2.1 profiles (사용자 프로필)
```sql
- id: uuid (PK, auth.users 참조)
- email: text (NOT NULL)
- full_name: text (NOT NULL)
- company_name: text (nullable, 제휴업체용)
- phone: text (nullable)
- role: app_role ENUM ('STAFF' | 'PARTNER')
- service_type: text (nullable, 서비스 종류)
- service_regions: jsonb (nullable, 서비스 지역 배열)
- business_registration_number: text (nullable, 사업자등록번호)
- representative_name: text (nullable, 대표자명)
- commission_rate: numeric (nullable, 수수료율)
- slack_webhook_url: text (nullable)
- slack_channel_id: text (nullable)
- slack_user_id: text (nullable)
- created_at, updated_at: timestamp
```

### 2.2 orders (오더)
```sql
- id: uuid (PK)
- order_number: text (NOT NULL, 고유 주문번호 ORD[YYMMDD][3자리랜덤])
- partner_id: uuid (FK → profiles, 제휴업체)
- staff_id: uuid (FK → profiles, 담당 직원)
- customer_name: text (NOT NULL)
- customer_phone: text (nullable)
- service_type: text (NOT NULL, 케이터링/뷔페서비스/청소서비스/MC/사진촬영/파티룸)
- service_date: timestamp (NOT NULL)
- service_location: text (NOT NULL)
- amount: numeric (nullable)
- notes: text (nullable, 요청사항)
- partner_memo: text (nullable, 파트너 메모)
- status: order_status ENUM ('requested'|'accepted'|'confirmed'|'completed'|'settled'|'cancelled')
- completed_at: timestamp (nullable)
- created_at, updated_at: timestamp
```

### 2.3 order_files (오더 첨부파일)
```sql
- id: uuid (PK)
- order_id: uuid (FK → orders)
- file_name: text
- file_url: text
- file_type: text (nullable)
- uploaded_by: uuid (FK → profiles)
- created_at: timestamp
```

### 2.4 settlements (정산)
```sql
- id: uuid (PK)
- order_id: uuid (FK → orders, UNIQUE)
- partner_id: uuid (FK → profiles)
- amount: numeric
- payment_date: date (입금 예정일)
- status: text ('pending' | 'confirmed')
- confirmed_by: uuid (FK → profiles, nullable)
- confirmed_at: timestamp (nullable)
- created_at: timestamp
```

### 2.5 contracts (계약서)
```sql
- id: uuid (PK)
- created_by: uuid (FK → profiles)
- template_id: uuid (FK → contract_templates, nullable)
- access_token: uuid (공개 링크용 토큰)
- location: text (장소)
- reservation_date: date
- checkin_time: time
- checkout_time: time
- guest_count: integer
- base_price, additional_price, cleaning_fee, vat, total_amount: numeric
- customer_name, company_name, phone_number: text (nullable)
- purpose, visit_source: text (nullable)
- receipt_type, cash_receipt_type: text (nullable)
- business_* 필드들: 세금계산서용 사업자 정보
- personal_id_number, personal_phone, receipt_email: 현금영수증용
- agreed: boolean
- signature_data: text (서명 데이터)
- submitted_at: timestamp (nullable)
- created_at, updated_at: timestamp
```

### 2.6 contract_templates (계약서 템플릿)
```sql
- id: uuid (PK)
- created_by: uuid (FK → profiles)
- name: text
- description: text (nullable)
- base_price, additional_price_per_person, cleaning_fee, vat_rate: numeric
- base_guest_count: integer
- terms_content: text (약관 내용)
- refund_policy: text (환불 정책)
- pricing_items: jsonb (가격 항목 배열)
- image_urls: jsonb (이미지 URL 배열)
- is_active: boolean
- created_at, updated_at: timestamp
```

### 2.7 calendar_events (캘린더 일정)
```sql
- id: uuid (PK)
- created_by: uuid (FK → profiles)
- title: text
- description: text (nullable)
- start_time, end_time: timestamp
- event_type: text
- location: text (nullable)
- color: text (기본 #3b82f6)
- is_all_day: boolean
- meeting_url: text (nullable)
- recurrence_rule, recurrence_end_date: 반복 일정용
- attendees, reminders, attachments: jsonb
- visibility: text
- created_at, updated_at: timestamp
```

### 2.8 notifications (알림)
```sql
- id: uuid (PK)
- user_id: uuid (FK → profiles)
- title: text
- message: text
- type: text ('info'|'success'|'warning'|'error')
- is_read: boolean
- related_order_id: uuid (FK → orders, nullable)
- created_at: timestamp
```

### 2.9 messages (메시지)
```sql
- id: uuid (PK)
- sender_id: uuid (FK → profiles)
- receiver_id: uuid (FK → profiles, nullable)
- order_id: uuid (FK → orders, nullable)
- message: text
- sender_name, sender_email, sender_role: text (nullable)
- is_read: boolean
- created_at: timestamp
```

### 2.10 pricing_rule_groups / pricing_rules (가격 정책)
```sql
-- pricing_rule_groups
- id: uuid (PK)
- profile_id: uuid (nullable, 특정 업체용)
- name: text
- description: text (nullable)
- season_type: text ('regular'|'peak'|'off')
- is_active: boolean
- created_by: uuid
- created_at, updated_at: timestamp

-- pricing_rules
- id: uuid (PK)
- group_id: uuid (FK → pricing_rule_groups)
- name: text
- rule_type: text
- months: int[] (적용 월)
- weekdays: int[] (0=일~6=토)
- start_time, end_time: time (nullable)
- min_guests, max_guests: int (nullable)
- base_guest_count: int (기본 인원)
- price: numeric (기본 가격)
- price_per_additional_guest: numeric (추가 인원당 가격)
- is_percentage: boolean (할인/할증률인지)
- priority: int (우선순위)
- is_active: boolean
- condition: jsonb (nullable)
- created_at, updated_at: timestamp
```

### 2.11 user_roles (사용자 역할)
```sql
- id: uuid (PK)
- user_id: uuid (FK → profiles)
- role: app_role
- created_at: timestamp
```

---

## 3. 인증 시스템

### 3.1 로그인/회원가입 (/auth)
- 이메일/비밀번호 기반 인증
- 회원가입 시 역할 선택 (STAFF / PARTNER)
- PARTNER 회원가입 시 추가 정보:
  - 업체명, 연락처, 사업자등록번호, 대표자명
  - 서비스 유형 선택 (케이터링, 뷔페서비스, 청소서비스, MC, 사진촬영, 파티룸)
  - 서비스 지역 다중 선택 (시도/구군 2단계)
- 회원가입 트리거: `handle_new_user()` 함수가 auth.users INSERT 시 profiles + user_roles 자동 생성
- 자동 이메일 확인 활성화 (테스트 편의)

### 3.2 세션 관리
- `supabase.auth.onAuthStateChange` 리스너로 세션 상태 관리
- 로그인 상태에 따른 리다이렉트 처리
- 로그아웃 시 `/auth` 페이지로 이동

---

## 4. 페이지별 상세 기능

### 4.1 대시보드 (/)
**공통:**
- 통계 카드 4개: 전체 오더, 진행중 오더, 완료된 오더, 정산금액
- 최근 오더 5개 목록 (클릭 시 오더 관리로 이동)
- 실시간 오더 업데이트 (Supabase Realtime)

**PARTNER 전용:**
- 수락 대기 오더 알림 카드 (빨간 뱃지, 클릭 시 오더 수락 페이지 이동)
- 본인 오더/정산만 표시

**STAFF:**
- 전체 오더/정산 통계

---

### 4.2 오더 수락 (/orders/accept) - PARTNER 전용
- 자신에게 요청된 `status: 'requested'` 오더 목록
- 각 오더 카드에:
  - 주문번호, 서비스 유형 뱃지
  - 고객명, 장소, 금액, 서비스 일시
  - 요청사항
  - **OrderStatusStepper**: 오더 진행상태 시각화 (요청됨 → 수락됨 → 확정됨 → 완료)
- 수락/거절 버튼
  - 수락: status → 'accepted'
  - 거절: status → 'cancelled'
- 채널톡 연동: `syncOrderToChannelTalk()` 호출

---

### 4.3 오더 관리 (/orders/manage) - PARTNER 전용
- 자신이 수락/확정/완료한 오더 목록 (`accepted`, `confirmed`, `completed`)
- 필터: 상태별, 검색 (오더번호, 고객명)
- 페이지네이션 (20개/페이지)
- 진행상태 안내 카드

**각 오더 카드:**
- OrderStatusStepper
- 기본 정보 (고객명, 장소, 금액)
- 요청사항 표시
- **OrderInquiryButton**: 채널톡으로 해당 오더 문의
- **OrderMemo**: 파트너 메모 저장/수정 (본인만 조회 가능)

**확정됨(confirmed) 상태에서:**
- "완료 처리하기" 버튼 클릭 시:
  1. 완료일자 선택 (필수)
  2. 파일 첨부 (필수, 다중 업로드 지원)
  3. 메모 입력 (선택)
  4. 완료 처리 → status: 'completed'
- 파일은 Supabase Storage `order-files` 버킷에 저장

---

### 4.4 오더 요청 (/orders/request) - STAFF 전용
**오더 생성 폼:**
- 제휴업체 선택 (profiles에서 role='PARTNER' 조회)
- 선택 시 해당 업체의 service_type 자동 설정
- 입력 필드:
  - 고객명 (필수)
  - 고객 연락처
  - 서비스 종류 (필수)
  - 서비스 일시 (datetime-local, 필수)
  - 서비스 장소 (필수)
  - 금액
  - 요청사항

**주문번호 생성 규칙:**
```
ORD + YY + MM + DD + 랜덤3자리
예: ORD2510081234
```

**생성 후:**
- 채널톡 동기화
- 폼 초기화

---

### 4.5 오더 전체보기 (/orders/all) - STAFF 전용
- 모든 오더 조회 (partner_profile, staff_profile 조인)
- 필터: 상태별, 담당 직원별, 검색
- 페이지네이션 (20개/페이지)
- 일괄 선택/취소 기능

**각 오더 카드:**
- 체크박스 (일괄 선택용)
- OrderStatusStepper
- 제휴업체명, 고객명, 담당자, 금액, 서비스일시

**상태별 액션:**
- `accepted` → "확정" 버튼: 캘린더 이벤트 자동 생성, 파트너에게 알림
- 모든 상태 → "취소" 버튼: status → 'cancelled', 파트너에게 알림

---

### 4.6 일정 보기 (/calendar)
- react-day-picker 기반 월간 캘린더
- 날짜 클릭 시 해당 날짜의 일정 목록 다이얼로그
- 오더 확정 시 자동 생성된 일정 표시
- STAFF: 전체 일정 조회
- PARTNER: 본인 일정만 조회

---

### 4.7 정산 현황 (/settlements) - PARTNER 전용
- 본인의 정산 내역 조회
- 정산 대기/완료 상태 구분
- 월별 정산 금액 합계

---

### 4.8 정산 관리 (/settlements/manage) - STAFF 전용
- 완료/정산완료 오더 목록 (`completed`, `settled`)
- 필터: 상태별, 검색
- 일괄 선택/삭제 기능

**정산 대기 오더:**
- "정산 확정하기" 클릭
- 입금 예정일 선택
- 확정 시:
  - settlements 테이블에 레코드 생성
  - 오더 status → 'settled'
  - 파트너에게 알림 발송

---

### 4.9 제휴업체 응답률관리 (/partners) - STAFF 전용
- 제휴업체별 통계:
  - 총 요청 수
  - 수락/거절/완료 수
  - 응답률 (%)
  - 평균 응답시간
- 필터: 지역별, 서비스유형별
- 정렬: 응답률순
- 검색: 업체명, 담당자명, 이메일

---

### 4.10 제휴업체 가격관리 (/pricing) - STAFF 전용
**가격 규칙 그룹:**
- 일반(공통) 또는 특정 업체별 규칙
- 시즌 유형 (regular/peak/off)
- 활성화 상태

**가격 규칙:**
- 규칙명
- 적용 조건:
  - 월 (다중 선택)
  - 요일 (다중 선택, 0=일~6=토)
  - 시간대 (시작~종료)
  - 인원 범위 (최소~최대)
- 가격 설정:
  - 기본 인원수
  - 기본 가격
  - 추가 인원당 가격
  - 퍼센트 할인/할증 여부
- 우선순위

---

### 4.11 대관료계산기 (/fee-calculator) - STAFF 전용
**입력:**
- 지점/업체 선택
- 날짜 (캘린더)
- 시간 (시작/종료)
- 예상 인원

**계산 로직:**
1. 해당 업체 또는 일반 규칙 그룹 필터링
2. 조건에 맞는 규칙 매칭 (월, 요일, 시간, 인원)
3. 우선순위 정렬
4. 기본 요금 + 추가 인원 요금 계산
5. 퍼센트 할인/할증 적용

**결과:**
- 예상 대관료 총액
- 적용된 규칙 목록 (상세 breakdown)

---

### 4.12 전자서명관리 (/contracts) - STAFF 전용
**계약서 목록:**
- 필터: 고객명, 날짜, 담당자
- 페이지네이션 (5개/페이지)
- 서명완료/대기중 뱃지

**각 계약서:**
- 장소, 예약일, 인원, 금액
- 고객명, 생성일, 담당자
- 액션: 링크 복사, 미리보기, 삭제

**링크 형식:** `/contract/{access_token}`

---

### 4.13 계약서 작성 (/contracts/create)
**폼 입력:**
- 템플릿 선택
- 장소
- 예약일, 체크인/체크아웃 시간
- 예상 인원

**자동 계산 (템플릿 기반):**
- 기본 이용료
- 추가 인원 비용
- 청소대행비
- 부가세
- 총액

**생성 후:** access_token으로 공개 링크 생성

---

### 4.14 계약서 응답 페이지 (/contract/:token)
**고객이 작성:**
- 예약자 정보 (이름, 회사명, 연락처)
- 이용 목적
- 알게된 경로
- 영수증 유형 (세금계산서/현금영수증/불필요)
- 세금계산서: 사업자 정보 입력
- 현금영수증: 개인/사업자 선택, 정보 입력
- 약관 동의 체크박스
- 서명 (Canvas 기반 서명패드)

**제출 시:** agreed=true, submitted_at 기록

---

### 4.15 템플릿 관리 (/contracts/templates)
- 템플릿 목록 (활성/비활성 구분)
- 생성/수정/삭제

**템플릿 폼 (/contracts/templates/create, /contracts/templates/edit/:id):**
- 템플릿명, 설명
- 기본 가격, 추가 인원당 가격
- 기본 인원수
- 청소대행비
- 부가세율
- 가격 항목 (동적 필드)
- 이미지 URL
- 이용약관
- 환불정책
- 활성화 상태

---

### 4.16 공간검색하기 (/space-finder) - STAFF 전용
- 파트너 공간 검색
- 지역, 서비스 유형 필터

---

### 4.17 견적서 작성 (/quote) - STAFF 전용
- 외부 견적서 생성 도구 iframe 임베드
- URL: `https://simply-quote-gen.vercel.app/`

---

### 4.18 아임웹 로그인 (/imweb) - STAFF 전용
- 아임웹 관리자 페이지 iframe 임베드
- 자동 로그인 URL 사용

---

### 4.19 사용자 관리 (/users) - STAFF 전용
**사용자 목록:**
- 테이블 형태 (이름, 이메일, 역할, 업체명, 서비스유형, 지역)
- 검색 (이름, 업체명, 전화번호, 사업자번호)

**사용자 추가:**
- 이메일, 비밀번호
- 역할 (STAFF/PARTNER)
- 이름
- PARTNER인 경우:
  - 업체명, 연락처, 서비스유형
  - 서비스 지역 (다중 선택)
  - 사업자등록번호, 대표자명
  - 수수료율

**사용자 수정:**
- 비밀번호 제외 모든 정보 수정 가능
- STAFF: Slack User ID 설정

**Slack 연동 설정:**
- Webhook URL
- Channel ID

---

### 4.20 프로필 설정 (/profile)
- 본인 정보 수정
- 비밀번호 변경

---

### 4.21 사용 가이드 (/guide)
- 역할별 기능 안내 카드
- 아코디언 형태의 상세 가이드
- PARTNER: 오더 수락, 오더 관리, 정산 확인, 메모, CS 문의
- STAFF: 공간검색, 대관료계산, 견적서, 전자서명, 오더관리, 정산, 응답률, 가격관리, 사용자관리, 아임웹 로그인

---

## 5. 공통 컴포넌트

### 5.1 DashboardLayout
- 사이드바 네비게이션 (역할별 메뉴 필터링)
- 상단바 (로고, 사용자 정보, 로그아웃)
- 모바일 반응형 (햄버거 메뉴)
- 실시간 대기 오더 수 뱃지 (PARTNER)
- 채널톡 통합 (PARTNER)

### 5.2 OrderStatusStepper
- 오더 상태를 시각적 스텝퍼로 표시
- 단계: 요청됨 → 수락됨 → 확정됨 → 완료

### 5.3 NotificationBell
- 읽지 않은 알림 수 표시
- 알림 목록 드롭다운
- 클릭 시 읽음 처리
- 관련 오더로 이동

### 5.4 OrderInquiryButton
- 채널톡으로 해당 오더 문의
- 오더 정보 자동 포함

### 5.5 OrderMemo
- 파트너 전용 메모 기능
- 다이얼로그로 수정

### 5.6 OrderFileUpload
- 다중 파일 업로드
- 파일 미리보기/삭제
- 이미지/문서 아이콘 구분

---

## 6. 외부 연동

### 6.1 채널톡
- PARTNER 로그인 시 자동 부트
- 사용자 정보 연동
- 오더별 문의 기능
- Edge Function: `channel-talk-app`, `sync-order-to-channel-talk`

### 6.2 Slack
- 오더 알림 발송
- Edge Function: `send-to-slack`, `slack-events`
- 프로필별 Webhook URL 설정

### 6.3 아임웹
- 관리자 페이지 iframe 임베드
- 자동 로그인

---

## 7. RLS (Row Level Security) 정책 요약

### profiles
- 본인 프로필 조회/수정 가능
- STAFF는 모든 프로필 조회/수정/삭제 가능

### orders
- PARTNER: 본인 오더만 조회/수정
- STAFF: 모든 오더 조회/생성/수정

### settlements
- PARTNER: 본인 정산만 조회
- STAFF: 모든 정산 조회/관리

### contracts, contract_templates
- 익명 사용자: 조회만 가능
- STAFF: 전체 CRUD

### notifications
- 본인 알림만 조회/수정/삭제
- STAFF만 알림 생성 가능

### calendar_events
- 본인 일정 CRUD
- STAFF는 모든 일정 조회 가능

---

## 8. UI/UX 디자인 가이드

### 8.1 색상
- Primary: 그라디언트 (bg-gradient-primary)
- 상태별 색상:
  - 요청됨: yellow-500
  - 수락됨: blue-500
  - 확정됨: primary (gradient)
  - 완료: green-500
  - 정산완료: purple-500
  - 취소: gray-500

### 8.2 레이아웃
- 사이드바 고정 (lg 이상)
- 모바일: 상단바 + 슬라이드 메뉴
- 카드 기반 콘텐츠
- 반응형 그리드

### 8.3 인터랙션
- 토스트 알림 (sonner)
- 로딩 상태 표시
- 확인 다이얼로그 (삭제 등 위험 작업)
- 호버 효과

### 8.4 폰트 및 타이포그래피
- 한글 최적화
- 제목: text-3xl font-bold
- 본문: text-sm
- 금액: font-semibold text-primary

---

## 9. Edge Functions

### 9.1 channel-talk-app
채널톡 앱 연동

### 9.2 sync-order-to-channel-talk
오더 상태 변경 시 채널톡 동기화

### 9.3 send-to-slack
Slack 웹훅으로 알림 발송

### 9.4 slack-events
Slack 이벤트 처리

### 9.5 reset-password
비밀번호 재설정

---

## 10. 마이그레이션 체크리스트

### Phase 1: 기본 설정
- [ ] Next.js 프로젝트 생성 (App Router)
- [ ] Tailwind CSS + shadcn/ui 설정
- [ ] Supabase 클라이언트 설정
- [ ] 환경변수 설정

### Phase 2: 인증
- [ ] 로그인/회원가입 페이지
- [ ] 미들웨어로 인증 체크
- [ ] 세션 관리

### Phase 3: 레이아웃
- [ ] DashboardLayout 구현
- [ ] 역할별 네비게이션
- [ ] 반응형 처리

### Phase 4: 핵심 기능
- [ ] 대시보드
- [ ] 오더 CRUD
- [ ] 정산 관리
- [ ] 계약서 관리

### Phase 5: 부가 기능
- [ ] 가격 관리
- [ ] 캘린더
- [ ] 알림
- [ ] 사용자 관리

### Phase 6: 외부 연동
- [ ] 채널톡
- [ ] Slack
- [ ] 아임웹 iframe

### Phase 7: 최적화
- [ ] Server Components 활용
- [ ] 이미지 최적화
- [ ] SEO

---

## 11. 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHANNEL_TALK_APP_ID=
CHANNEL_TALK_APP_SECRET=
SLACK_WEBHOOK_URL=
```

---

이 문서를 기반으로 Next.js 프로젝트를 구축하시면 됩니다. 
각 페이지와 컴포넌트의 상세 구현은 현재 React 코드를 참조하세요.
