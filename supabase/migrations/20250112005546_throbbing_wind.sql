/*
  # Fix User RLS Policies Recursion

  1. Changes
     - Drop existing user policies that cause recursion
     - Create simplified policies without self-referential queries
     - Fix infinite recursion issue in supervisor policy

  2. Security
     - Administrators maintain full access
     - Users can still see their own data
     - Supervisors can see their organizers without recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Administrators full access" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Supervisors read organizers" ON users;

-- Create new simplified policies
CREATE POLICY "Users select policy"
ON users
FOR SELECT
TO authenticated
USING (
  -- Administrators can see all users
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can see their own data
  auth.uid() = id OR
  -- Supervisors can see their organizers (simplified)
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    (
      -- Can see themselves
      auth.uid() = id OR
      -- Can see users they supervise
      supervisor_id = auth.uid()
    )
  )
);

-- Separate policy for modifications (admin only)
CREATE POLICY "Users modify policy"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'administrator'
);