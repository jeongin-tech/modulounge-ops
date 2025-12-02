-- Add base_guest_count and price_per_additional_guest columns to pricing_rules
ALTER TABLE public.pricing_rules 
ADD COLUMN IF NOT EXISTS base_guest_count INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS price_per_additional_guest NUMERIC DEFAULT 0;