-- STAFF가 모든 프로필을 업데이트할 수 있도록 정책 추가
CREATE POLICY "Staff can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'STAFF'))
WITH CHECK (has_role(auth.uid(), 'STAFF'));