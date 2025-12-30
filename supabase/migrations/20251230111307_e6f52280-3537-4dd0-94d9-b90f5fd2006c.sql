-- 채널톡 상담 요약을 저장할 테이블 생성
CREATE TABLE public.channel_talk_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  customer_info TEXT,
  event_date TEXT,
  location TEXT,
  inquiry_content TEXT,
  coordination_feasibility TEXT,
  staff_handling TEXT,
  customer_tendency TEXT,
  upselling TEXT,
  recommended_script TEXT,
  keywords TEXT,
  raw_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channel_talk_summaries ENABLE ROW LEVEL SECURITY;

-- STAFF만 조회 가능
CREATE POLICY "Staff can view all summaries" 
ON public.channel_talk_summaries 
FOR SELECT 
USING (has_role(auth.uid(), 'STAFF'::app_role));

-- STAFF만 삭제 가능
CREATE POLICY "Staff can delete summaries" 
ON public.channel_talk_summaries 
FOR DELETE 
USING (has_role(auth.uid(), 'STAFF'::app_role));

-- 웹훅은 서비스 역할로 INSERT (anon 허용)
CREATE POLICY "Allow insert from webhook" 
ON public.channel_talk_summaries 
FOR INSERT 
WITH CHECK (true);

-- 업데이트 타임스탬프 트리거
CREATE TRIGGER update_channel_talk_summaries_updated_at
BEFORE UPDATE ON public.channel_talk_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();