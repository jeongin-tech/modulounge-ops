-- Fix RLS policies for public contract access
-- Drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contracts;
DROP POLICY IF EXISTS "Enable update for all users" ON public.contracts;
DROP POLICY IF EXISTS "Enable read access for all active templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Staff can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff can view all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Staff can view all templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Staff can create templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Staff can update templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Staff can delete templates" ON public.contract_templates;

-- Create simple anonymous access policies for contracts
CREATE POLICY "anon_select_contracts"
ON public.contracts
FOR SELECT
TO anon
USING (true);

CREATE POLICY "anon_update_contracts"
ON public.contracts
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Staff policies for contracts
CREATE POLICY "staff_all_contracts"
ON public.contracts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'STAFF'::app_role))
WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));

-- Create anonymous access policy for contract templates
CREATE POLICY "anon_select_templates"
ON public.contract_templates
FOR SELECT
TO anon
USING (true);

-- Staff policies for templates
CREATE POLICY "staff_all_templates"
ON public.contract_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'STAFF'::app_role))
WITH CHECK (has_role(auth.uid(), 'STAFF'::app_role));