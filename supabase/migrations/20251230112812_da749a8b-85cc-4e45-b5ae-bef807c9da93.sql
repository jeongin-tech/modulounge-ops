-- 고객 이름과 연락처 컬럼 추가
ALTER TABLE public.channel_talk_summaries
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text;