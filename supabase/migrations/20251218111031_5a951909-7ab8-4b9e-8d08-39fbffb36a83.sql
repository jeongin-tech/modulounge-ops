-- contracts 테이블에 pricing_items 컬럼 추가
ALTER TABLE public.contracts 
ADD COLUMN pricing_items jsonb DEFAULT NULL;