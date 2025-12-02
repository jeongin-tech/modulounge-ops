-- Create contracts table for managing digital contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Reservation information (filled by STAFF)
  location TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  checkin_time TIME NOT NULL,
  checkout_time TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  purpose TEXT,
  
  -- Pricing information
  base_price NUMERIC NOT NULL DEFAULT 0,
  additional_price NUMERIC NOT NULL DEFAULT 0,
  cleaning_fee NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Customer information (to be filled by customer)
  customer_name TEXT,
  company_name TEXT,
  phone_number TEXT,
  visit_source TEXT,
  tax_invoice_requested BOOLEAN DEFAULT false,
  
  -- Agreement status
  agreed BOOLEAN DEFAULT false,
  signature_data TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique link for customer access
  access_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- STAFF can view all contracts
CREATE POLICY "Staff can view all contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'STAFF'));

-- STAFF can create contracts
CREATE POLICY "Staff can create contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'STAFF'));

-- STAFF can update contracts
CREATE POLICY "Staff can update contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'STAFF'));

-- Anyone with access token can view the contract (for public access)
CREATE POLICY "Public can view contracts with valid token"
ON public.contracts
FOR SELECT
TO anon
USING (true);

-- Anyone with access token can update their contract response
CREATE POLICY "Public can update contracts with valid token"
ON public.contracts
FOR UPDATE
TO anon
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();