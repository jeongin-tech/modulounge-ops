-- Update RLS policies for calendar_events
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;

-- Partners can only view their own events
CREATE POLICY "Partners can view their own calendar events"
ON calendar_events
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'STAFF')
);

-- Staff can view all events (already handled in the policy above)

-- Update attendees policy
DROP POLICY IF EXISTS "Users can view attendees of events they can see" ON calendar_event_attendees;

CREATE POLICY "Users can view attendees of their events"
ON calendar_event_attendees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calendar_events
    WHERE calendar_events.id = calendar_event_attendees.event_id
    AND (calendar_events.created_by = auth.uid() OR has_role(auth.uid(), 'STAFF'))
  )
);