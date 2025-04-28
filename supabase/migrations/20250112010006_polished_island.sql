/*
  # Fix User Update Policies

  1. Changes
     - Drop existing user policies that may conflict
     - Create separate policies for SELECT and UPDATE operations
     - Fix permissions for user updates

  2. Security
     - Maintains administrator full access
     - Allows users to update their own data
     - Allows supervisors to update their organizers' data
*/

-- Drop existing user policies
DROP POLICY IF EXISTS "Users select policy" ON users;
DROP POLICY IF EXISTS "Users modify policy" ON users;
DROP POLICY IF EXISTS "block_anonymous_users" ON users;

-- Create comprehensive user policies
CREATE POLICY "Users read access"
ON users
FOR SELECT
TO authenticated
USING (
  -- Administrators can see all users
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can see their own data
  auth.uid() = id OR
  -- Supervisors can see their organizers
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    (
      id = auth.uid() OR
      supervisor_id = auth.uid() OR
      auth.uid() = ANY(COALESCE(organizer_ids, '{}'))
    )
  )
);

CREATE POLICY "Users update access"
ON users
FOR UPDATE
TO authenticated
USING (
  -- Administrators can update any user
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can update their own non-critical data
  auth.uid() = id OR
  -- Supervisors can update their organizers
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    (
      id = ANY(COALESCE(organizer_ids, '{}')) OR
      supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Administrators can update any user
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can update their own non-critical data
  auth.uid() = id OR
  -- Supervisors can update their organizers
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    (
      id = ANY(COALESCE(organizer_ids, '{}')) OR
      supervisor_id = auth.uid()
    )
  )
);

CREATE POLICY "Users insert delete access"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'administrator'
);

-- Re-add anonymous access block
CREATE POLICY "block_anonymous_users"
ON users
FOR ALL
USING (auth.uid() IS NOT NULL);