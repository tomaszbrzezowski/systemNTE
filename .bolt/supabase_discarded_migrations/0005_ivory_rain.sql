/*
  # Fix user creation policies

  1. Changes
    - Add service role policy for user creation
    - Update user creation trigger to handle metadata
    - Fix recursive policy issues
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_read_self" ON users;
DROP POLICY IF EXISTS "users_read_admin" ON users;
DROP POLICY IF EXISTS "users_read_supervisor" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_update_supervisor" ON users;

-- Create simplified policies
CREATE POLICY "enable_read_access"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_insert_for_service"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "enable_update_for_service"
ON users FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Update user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizator')::user_role,
    true,
    '{}',
    '{}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;