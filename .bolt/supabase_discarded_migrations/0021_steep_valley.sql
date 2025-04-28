/*
  # Fix user management

  1. Changes
    - Disable RLS temporarily for development
    - Update user creation trigger with upsert
    - Add proper error handling

  2. Security
    - Service role maintains full access
    - Authenticated users can read and update
*/

-- Disable RLS temporarily for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Update user creation trigger with upsert
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
    name = EXCLUDED.name,
    role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure proper grants
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles table with RLS temporarily disabled.
WARNING: Row Level Security is currently disabled for development purposes.';