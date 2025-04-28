/*
  # Fix user creation and permissions

  1. Changes
    - Enable RLS with service role bypass
    - Update user creation policies
    - Add better error handling to user creation trigger
    - Fix permission issues
*/

-- Enable RLS but allow service role to bypass
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant full access to service role
GRANT ALL ON users TO service_role;

-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_insert_for_service" ON users;
DROP POLICY IF EXISTS "enable_update_for_service" ON users;

-- Create new policies
CREATE POLICY "allow_read_users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_insert_users"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "allow_update_users"
ON users FOR UPDATE
TO service_role
USING (true);

-- Update user creation trigger with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _role user_role;
BEGIN
  -- Validate and set role with proper error handling
  BEGIN
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'organizator')::user_role;
  EXCEPTION 
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid role specified';
  END;

  BEGIN
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
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'User with this email already exists';
    WHEN others THEN
      RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;