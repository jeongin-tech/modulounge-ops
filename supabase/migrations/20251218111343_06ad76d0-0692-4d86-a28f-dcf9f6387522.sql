-- contracts 테이블에 reservation_items 컬럼 추가
ALTER TABLE public.contracts 
ADD COLUMN reservation_items jsonb DEFAULT NULL;