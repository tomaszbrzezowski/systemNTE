/*
  # Fix RLS and user update policies

  1. Changes
    - Enable RLS with proper bypass for service role
    - Create comprehensive policies for different roles
    - Fix user update permissions
    - Improve error handling in trigger function

  2. Security
    - Enable RLS with proper policies
    - Service role maintains full access
    - Authenticated users get role-based access
*/

-- Enable RLS with service role bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users'
  );
END $$;

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Create read policy for authenticated users
CREATE POLICY "users_read"
ON users FOR SELECT
TO authenticated
USING (true);

-- Create service role policy for all operations
CREATE POLICY "users_service_access"
ON users
TO service_role
USING (true)
WITH CHECK (true);

-- Create update policies
CREATE POLICY "users_admin_update"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
)
WITH CHECK (true);

CREATE POLICY "users_self_update"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  -- Cannot change role or supervisor assignments
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "users_supervisor_update"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.role = 'organizator'
    AND users.id = ANY(supervisor.organizer_ids)
  )
)
WITH CHECK (
  role = 'organizator'
);

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
    role = COALESCE(EXCLUDED.role, users.role);

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles with role-based permissions:
- All authenticated users can read user data
- Service role has full access
- Administrators can update any user
- Users can update their own non-sensitive fields
- Supervisors can update their assigned organizers';