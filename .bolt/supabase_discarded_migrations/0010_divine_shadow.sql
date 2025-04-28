/*
  # Fix RLS Policies for User Management

  1. Changes
    - Drop all existing user policies
    - Create new simplified policies with proper permissions
    - Add stored procedure for user updates
    - Fix grants and permissions

  2. Security
    - Enable RLS on users table
    - Grant appropriate permissions to roles
    - Add policies for read/write access
*/

-- Drop all existing policies
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

-- Create stored procedure for user updates
CREATE OR REPLACE FUNCTION update_user(
  user_id uuid,
  user_updates jsonb
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result users;
BEGIN
  -- Check permissions
  IF NOT (
    -- Admin can update anyone
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator')
    OR
    -- Users can update themselves
    auth.uid() = user_id
    OR
    -- Supervisors can update their organizers
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'supervisor' 
      AND user_id = ANY(organizer_ids)
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Perform update
  UPDATE users
  SET
    name = COALESCE(user_updates->>'name', name),
    role = COALESCE((user_updates->>'role')::user_role, role),
    active = COALESCE((user_updates->>'active')::boolean, active),
    assigned_city_ids = COALESCE((user_updates->>'assigned_city_ids')::uuid[], assigned_city_ids),
    organizer_ids = COALESCE((user_updates->>'organizer_ids')::uuid[], organizer_ids),
    supervisor_id = COALESCE((user_updates->>'supervisor_id')::uuid, supervisor_id)
  WHERE id = user_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Basic read policy for authenticated users
CREATE POLICY "users_read"
ON users FOR SELECT
TO authenticated
USING (true);

-- Service role insert policy
CREATE POLICY "users_service_insert"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

-- Admin update policy
CREATE POLICY "users_admin_update"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- Self update policy
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

-- Supervisor update policy
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