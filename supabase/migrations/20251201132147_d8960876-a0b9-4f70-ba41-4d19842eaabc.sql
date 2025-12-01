-- Update calendar_events to reference profiles instead of auth.users
ALTER TABLE public.calendar_events 
DROP CONSTRAINT calendar_events_created_by_fkey;

ALTER TABLE public.calendar_events 
ADD CONSTRAINT calendar_events_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;