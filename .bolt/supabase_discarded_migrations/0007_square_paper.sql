/*
  # Fix user update policies

  1. Changes
    - Add proper RLS policies for user updates
    - Allow administrators to update any user
    - Allow users to update their own non-sensitive fields
    - Allow supervisors to update their organizers
  
  2. Security
    - Maintain strict role-based access control
    - Prevent unauthorized updates
    - Protect sensitive fields
*/

-- Drop existing update policies
DROP POLICY IF EXISTS "allow_update_users" ON users;

-- Create specific update policies
CREATE POLICY "allow_admin_update_users"
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

CREATE POLICY "allow_self_update_users"
ON users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  -- Cannot change role or supervisor assignments
  role = (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid()) AND
  organizer_ids IS NOT DISTINCT FROM (SELECT organizer_ids FROM users WHERE id = auth.uid())
);

CREATE POLICY "allow_supervisor_update_organizers"
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
  -- Supervisors can only update certain fields for their organizers
  role = 'organizator' AND
  supervisor_id = auth.uid()
);

-- Ensure service role still has full access
GRANT ALL ON users TO service_role;

-- Add comment explaining policies
COMMENT ON TABLE users IS 'User profiles with role-based update permissions:
- Administrators can update any user
- Users can update their own non-sensitive fields
- Supervisors can update their assigned organizers
- Service role has full access';