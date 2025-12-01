-- Add slack_user_id column to profiles table for STAFF users
ALTER TABLE public.profiles 
ADD COLUMN slack_user_id TEXT NULL;

-- Add index for faster lookups
CREATE INDEX idx_profiles_slack_user_id ON public.profiles(slack_user_id) WHERE slack_user_id IS NOT NULL;