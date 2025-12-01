-- Change service region columns to support multiple regions
ALTER TABLE public.profiles
DROP COLUMN service_region_sido,
DROP COLUMN service_region_gugun,
ADD COLUMN service_regions jsonb DEFAULT '[]'::jsonb;