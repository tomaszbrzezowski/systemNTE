-- Drop all existing user policies to start fresh
DROP POLICY IF EXISTS "Administrators can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Supervisors can view assigned organizers" ON users;
DROP POLICY IF EXISTS "Users can be created by administrators" ON users;
DROP POLICY IF EXISTS "Users can be updated by administrators" ON users;

-- Create a single comprehensive policy for SELECT
CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO authenticated
USING (
  -- User can view their own data
  id = auth.uid()
  OR
  -- Administrators can view all users
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'administrator'
  )
  OR
  -- Supervisors can view their organizers
  (
    supervisor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'supervisor'
    )
  )
);

-- Create policy for INSERT (administrators only)
CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- Create policy for UPDATE
CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (
  -- Administrators can update any user
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
  OR
  -- Users can update their own non-critical data
  id = auth.uid()
);

-- Create policy for DELETE (administrators only)
CREATE POLICY "users_delete_policy"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS maintain_user_relationships_trigger ON users;
DROP FUNCTION IF EXISTS maintain_user_relationships();

-- Simplified relationship maintenance function
CREATE OR REPLACE FUNCTION maintain_user_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear relationships when role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    -- Reset fields based on new role
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

-- Create new trigger
CREATE TRIGGER maintain_user_relationships_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION maintain_user_relationships();