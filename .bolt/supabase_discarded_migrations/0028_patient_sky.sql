/*
  # Disable OTP and Update User Creation

  1. Changes
    - Update user creation trigger to handle direct signups
    - Add better error handling
    - Set explicit search path for security

  2. Security
    - Add SECURITY DEFINER
    - Set explicit search path
    - Add error handling
*/

-- Update user creation trigger to handle direct signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _role user_role;
BEGIN
  -- Set default role with validation
  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'organizator')::user_role;
  EXCEPTION 
    WHEN invalid_text_representation THEN
      _role := 'organizator'::user_role;
  END;

  -- Insert or update user profile
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    active,
    assigned_city_ids,
    organizer_ids
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    _role,
    true,
    '{}',
    '{}'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role),
    active = true;

  -- Automatically confirm email
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;