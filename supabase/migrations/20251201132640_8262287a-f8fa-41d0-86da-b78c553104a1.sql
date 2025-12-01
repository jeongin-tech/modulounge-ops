-- Add new columns to calendar_events for Google Calendar features
ALTER TABLE public.calendar_events
ADD COLUMN is_all_day BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN color TEXT DEFAULT '#3b82f6',
ADD COLUMN recurrence_rule TEXT,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN visibility TEXT DEFAULT 'default',
ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb,
ADD COLUMN reminders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN meeting_url TEXT;

-- Create calendar_event_attendees table
CREATE TABLE public.calendar_event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT attendee_user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Enable RLS on attendees table
ALTER TABLE public.calendar_event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for attendees
CREATE POLICY "Users can view attendees of events they can see"
ON public.calendar_event_attendees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE calendar_events.id = calendar_event_attendees.event_id
  )
);

CREATE POLICY "Event creators can manage attendees"
ON public.calendar_event_attendees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE calendar_events.id = calendar_event_attendees.event_id
    AND calendar_events.created_by = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_event_attendees_event_id ON public.calendar_event_attendees(event_id);
CREATE INDEX idx_calendar_event_attendees_user_id ON public.calendar_event_attendees(user_id);