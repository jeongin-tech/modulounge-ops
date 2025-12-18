-- Add field_labels column to contract_templates table
ALTER TABLE public.contract_templates
ADD COLUMN IF NOT EXISTS field_labels jsonb DEFAULT '{
  "base_price": "기본 이용료",
  "base_guest_count": "기본 인원",
  "additional_price_per_person": "인당 추가 요금",
  "cleaning_fee": "청소대행비",
  "vat_rate": "부가세율"
}'::jsonb;