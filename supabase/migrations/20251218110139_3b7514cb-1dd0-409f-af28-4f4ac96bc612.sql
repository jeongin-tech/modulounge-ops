-- Add terms_content and refund_policy columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN terms_content text,
ADD COLUMN refund_policy text;