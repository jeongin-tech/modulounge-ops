-- 회원가입 시 자동으로 profiles와 user_roles를 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- raw_user_meta_data에서 role 가져오기 (기본값: PARTNER)
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role, 
    'PARTNER'::public.app_role
  );

  -- profiles 테이블에 삽입
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_name,
    phone,
    role,
    service_type,
    service_regions,
    business_registration_number,
    representative_name
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    user_role,
    NEW.raw_user_meta_data->>'service_type',
    COALESCE(NEW.raw_user_meta_data->'service_regions', '[]'::jsonb),
    NEW.raw_user_meta_data->>'business_registration_number',
    NEW.raw_user_meta_data->>'representative_name'
  );

  -- user_roles 테이블에 삽입
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 새 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();