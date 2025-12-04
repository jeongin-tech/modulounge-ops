-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order files
CREATE POLICY "Users can upload order files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-files' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view order files"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-files');

CREATE POLICY "Users can delete their own order files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-files' AND
  auth.uid() IS NOT NULL
);

-- Add partner_memo column to orders table for partner's internal notes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS partner_memo TEXT;