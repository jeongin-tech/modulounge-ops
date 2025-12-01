-- Create service_types table
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active service types
CREATE POLICY "Anyone can view active service types"
ON public.service_types
FOR SELECT
USING (is_active = true);

-- Allow STAFF to view all service types
CREATE POLICY "Staff can view all service types"
ON public.service_types
FOR SELECT
USING (has_role(auth.uid(), 'STAFF'));

-- Allow STAFF to manage service types
CREATE POLICY "Staff can insert service types"
ON public.service_types
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can update service types"
ON public.service_types
FOR UPDATE
USING (has_role(auth.uid(), 'STAFF'));

CREATE POLICY "Staff can delete service types"
ON public.service_types
FOR DELETE
USING (has_role(auth.uid(), 'STAFF'));

-- Insert initial service types
INSERT INTO public.service_types (name, display_order) VALUES
  ('케이터링', 1),
  ('뷔페서비스', 2),
  ('청소서비스', 3),
  ('MC', 4),
  ('사진촬영', 5),
  ('파티룸', 6);

-- Add foreign key to profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_service_type 
FOREIGN KEY (service_type) 
REFERENCES public.service_types(name)
ON DELETE SET NULL
ON UPDATE CASCADE;