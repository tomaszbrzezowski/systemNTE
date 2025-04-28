/*
  # Fix Auth Settings

  1. Changes
    - Update user creation trigger to auto-confirm emails
    - Add function to handle auth settings
    - Add better error handling
*/

-- Update user creation trigger to auto-confirm emails
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

  -- Auto-confirm email for new users
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW(),
      raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object('email_confirmed', true)
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user IS 'Handles new user creation with:
- Automatic email confirmation
- Default role assignment
- Profile creation
- Error handling';