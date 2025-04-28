/*
  # Update Cities RLS Policies

  1. Changes
     - Drop existing cities policies
     - Create new simplified policies for cities table
     - Allow administrators to see all cities
     - Maintain existing user access rules

  2. Security
     - Administrators have full access to all cities
     - Users can still see their assigned cities
     - Supervisors can see their organizers' cities
*/

-- Drop existing cities policies
DROP POLICY IF EXISTS "Cities access policy" ON cities;

-- Create new cities policies
CREATE POLICY "Cities admin access"
ON cities
FOR ALL
TO authenticated
USING (
  -- Administrators can see all cities
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  -- Only administrators can modify cities
  auth.jwt() ->> 'role' = 'administrator'
);

CREATE POLICY "Cities user access"
ON cities
FOR SELECT
TO authenticated
USING (
  -- Users can see their assigned cities
  id = ANY(COALESCE((
    SELECT assigned_city_ids 
    FROM users 
    WHERE id = auth.uid()
  ), '{}')) OR
  -- Supervisors can see their organizers' cities
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE supervisor_id = auth.uid()
      AND id = ANY(assigned_city_ids)
    )
  )
);