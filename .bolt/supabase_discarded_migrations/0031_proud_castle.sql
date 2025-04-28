/*
  # Fix users table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new simplified policies that allow:
      - Service role to have full access
      - Authenticated users to read all users
      - Administrators to manage users
      - Users to update their own profiles
  
  2. Security
    - Enable RLS on users table
    - Grant appropriate permissions
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

-- Create policies
CREATE POLICY "users_service_role_access"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "users_read_access"
ON users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_admin_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
  OR auth.uid() = id
);

CREATE POLICY "users_admin_update"
ON users
FOR UPDATE
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
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid())
);

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles with role-based permissions:
- Service role has full access
- All authenticated users can read
- Administrators can manage all users
- Users can update their own non-sensitive fields';