/*
  # Update User RLS Policies

  1. Changes
     - Drop existing user policies
     - Create new policy for administrators to see all users
     - Create policy for users to see their own data
     - Create policy for supervisors to see their organizers

  2. Security
     - Administrators have full access to all users
     - Users can only see their own data
     - Supervisors can see their assigned organizers
*/

-- Drop existing user policies
DROP POLICY IF EXISTS "Users full access policy" ON users;

-- Create separate policies for better control
CREATE POLICY "Administrators full access"
ON users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'administrator'
);

CREATE POLICY "Users read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Supervisors read organizers"
ON users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'supervisor' AND
  (
    -- Can see users where they are listed as supervisor
    auth.uid() = supervisor_id OR
    -- Can see users in their organizer_ids array
    id = ANY(COALESCE((
      SELECT organizer_ids 
      FROM users 
      WHERE id = auth.uid()
    ), '{}'))
  )
);