-- Add Slack integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN slack_webhook_url text,
ADD COLUMN slack_channel_id text;

COMMENT ON COLUMN public.profiles.slack_webhook_url IS 'Slack Incoming Webhook URL for this partner';
COMMENT ON COLUMN public.profiles.slack_channel_id IS 'Slack channel ID for identifying messages from this partner';