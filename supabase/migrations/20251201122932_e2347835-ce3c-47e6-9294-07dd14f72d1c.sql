-- Add service_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN service_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.service_type IS 'Service type provided by the partner (e.g., 케이터링, 뷔페서비스, 청소서비스, MC, 사진촬영, 파티룸)';
