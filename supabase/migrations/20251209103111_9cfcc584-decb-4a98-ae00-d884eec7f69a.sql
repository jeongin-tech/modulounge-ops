-- Allow staff to delete orders
CREATE POLICY "Staff can delete orders" 
ON public.orders 
FOR DELETE 
USING (has_role(auth.uid(), 'STAFF'::app_role));