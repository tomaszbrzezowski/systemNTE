/*
  # Fix User Permissions and RLS Policies

  1. Changes
    - Simplify RLS policies
    - Fix permission checks
    - Add proper service role access
    - Improve error handling

  2. Security
    - Enable RLS on users table
    - Grant proper permissions
    - Add specific policies for each role
*/

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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Create basic read policy
CREATE POLICY "users_read_all"
ON users FOR SELECT
TO authenticated
USING (true);

-- Create service role policies
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

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles with role-based permissions:
- All authenticated users can read user data
- Service role has full access
- Administrators can update any user
- Users can update their own non-sensitive fields
- Supervisors can update their assigned organizers';