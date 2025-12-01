-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    company_name, 
    phone, 
    role, 
    service_type,
    service_region_sido,
    service_region_gugun,
    business_registration_number,
    representative_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'PARTNER'),
    COALESCE(NEW.raw_user_meta_data->>'service_type', NULL),
    COALESCE(NEW.raw_user_meta_data->>'service_region_sido', NULL),
    COALESCE(NEW.raw_user_meta_data->>'service_region_gugun', NULL),
    COALESCE(NEW.raw_user_meta_data->>'business_registration_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'representative_name', NULL)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'PARTNER')
  );
  
  RETURN NEW;
END;
$function$;