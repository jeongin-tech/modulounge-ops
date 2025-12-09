-- calendar_events 테이블에 order_id 필드 추가
ALTER TABLE public.calendar_events 
ADD COLUMN order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

-- order_id에 인덱스 추가
CREATE INDEX idx_calendar_events_order_id ON public.calendar_events(order_id);