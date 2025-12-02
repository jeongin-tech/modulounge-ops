-- Add image_urls and pricing_items columns to contract_templates
ALTER TABLE public.contract_templates
ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN pricing_items JSONB DEFAULT '[
  {"label": "기본 이용료 (10인 기준)", "field": "base_price"},
  {"label": "인원 추가", "field": "additional_price"},
  {"label": "청소대행", "field": "cleaning_fee"},
  {"label": "부가세", "field": "vat"}
]'::jsonb;

-- Update existing templates with default pricing items
UPDATE public.contract_templates
SET pricing_items = '[
  {"label": "기본 이용료 (10인 기준)", "field": "base_price"},
  {"label": "인원 추가", "field": "additional_price"},
  {"label": "청소대행", "field": "cleaning_fee"},
  {"label": "부가세", "field": "vat"}
]'::jsonb
WHERE pricing_items IS NULL OR pricing_items = '[]'::jsonb;