-- 증빙 발행 관련 컬럼 추가
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS receipt_type text, -- 'tax_invoice', 'cash_receipt', 'none'
ADD COLUMN IF NOT EXISTS cash_receipt_type text, -- 'business', 'personal'
ADD COLUMN IF NOT EXISTS business_registration_number text,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_representative text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS business_category text,
ADD COLUMN IF NOT EXISTS receipt_email text,
ADD COLUMN IF NOT EXISTS personal_phone text,
ADD COLUMN IF NOT EXISTS personal_id_number text;

-- 기존 tax_invoice_requested 컬럼 마이그레이션 (true면 tax_invoice로)
UPDATE public.contracts 
SET receipt_type = CASE 
  WHEN tax_invoice_requested = true THEN 'tax_invoice'
  ELSE 'none'
END
WHERE receipt_type IS NULL;