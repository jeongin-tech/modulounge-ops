-- Allow STAFF to delete profiles
CREATE POLICY "Staff can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'STAFF'));