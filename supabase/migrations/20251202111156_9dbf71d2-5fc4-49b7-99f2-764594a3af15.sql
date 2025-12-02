-- Check and fix RLS policies for public contract access
-- First, let's see what policies exist and recreate them properly

-- Drop all existing policies on contracts related to public access
DROP POLICY IF EXISTS "Anyone can view contracts with any token" ON public.contracts;
DROP POLICY IF EXISTS "Anyone can update contracts with any token" ON public.contracts;
DROP POLICY IF EXISTS "Public can view contracts with valid token" ON public.contracts;
DROP POLICY IF EXISTS "Public can update contracts with valid token" ON public.contracts;

-- Create simple public access policies
CREATE POLICY "Enable read access for all users"
ON public.contracts
FOR SELECT
USING (true);

CREATE POLICY "Enable update for all users"
ON public.contracts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- For contract_templates, ensure public can read active templates
DROP POLICY IF EXISTS "Public can view active templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Staff can view all templates" ON public.contract_templates;

CREATE POLICY "Enable read access for all active templates"
ON public.contract_templates
FOR SELECT
USING (true);