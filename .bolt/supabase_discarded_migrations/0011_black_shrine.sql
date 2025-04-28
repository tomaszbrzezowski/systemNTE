-- Drop RPC function if it exists
DROP FUNCTION IF EXISTS update_user(uuid, jsonb);

-- Ensure proper RLS policies
DO $$ 
BEGIN
  -- Drop existing policies
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users'
  );
END $$;

-- Create simplified policies
CREATE POLICY "users_read_access"
ON users FOR SELECT
TO authenticated
USING (true);

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

CREATE POLICY "users_self_update"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
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

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;