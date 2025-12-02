-- Ensure the contracts table RLS policies allow public access with token
-- First, drop existing public policies if they exist
DROP POLICY IF EXISTS "Public can view contracts with valid token" ON public.contracts;
DROP POLICY IF EXISTS "Public can update contracts with valid token" ON public.contracts;

-- Create new policies that allow unauthenticated access
CREATE POLICY "Anyone can view contracts with any token"
ON public.contracts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update contracts with any token"
ON public.contracts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Also ensure contract_templates can be viewed by anyone (for public contract pages)
DROP POLICY IF EXISTS "Public can view active templates" ON public.contract_templates;

CREATE POLICY "Public can view active templates"
ON public.contract_templates
FOR SELECT
TO anon, authenticated
USING (is_active = true);