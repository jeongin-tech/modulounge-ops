-- Remove foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS fk_service_type;

-- Drop service_types table
DROP TABLE IF EXISTS public.service_types;