-- Add new columns to profiles table for partner registration
ALTER TABLE public.profiles
ADD COLUMN service_region_sido text,
ADD COLUMN service_region_gugun text,
ADD COLUMN business_registration_number text,
ADD COLUMN representative_name text,
ADD COLUMN commission_rate numeric;