-- Drop all existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- Create a simplified SELECT policy without recursion
CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO authenticated
USING (
  -- Users can always view their own data
  id = auth.uid()
  OR
  -- Administrators can view all users (using auth.users to avoid recursion)
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON u.id = au.id
    WHERE au.id = auth.uid()
    AND u.role = 'administrator'
  )
  OR
  -- Supervisors can view their organizers (using direct supervisor_id reference)
  supervisor_id = auth.uid()
);

-- Create simplified INSERT policy
CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON u.id = au.id
    WHERE au.id = auth.uid()
    AND u.role = 'administrator'
  )
);

-- Create simplified UPDATE policy
CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (
  -- Users can update their own data
  id = auth.uid()
  OR
  -- Administrators can update any user
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON u.id = au.id
    WHERE au.id = auth.uid()
    AND u.role = 'administrator'
  )
);

-- Create simplified DELETE policy
CREATE POLICY "users_delete_policy"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN users u ON u.id = au.id
    WHERE au.id = auth.uid()
    AND u.role = 'administrator'
  )
);

-- Update the relationship maintenance function
CREATE OR REPLACE FUNCTION maintain_user_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    -- Reset relationships based on new role
    CASE NEW.role
      WHEN 'organizator' THEN
        NEW.organizer_ids := '{}';
        NEW.supervisor_id := NULL;
      WHEN 'supervisor' THEN
        NEW.supervisor_id := NULL;
      WHEN 'administrator' THEN
        NEW.supervisor_id := NULL;
        NEW.organizer_ids := '{}';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;