-- Drop all existing policies and functions
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP FUNCTION IF EXISTS maintain_user_relationships();

-- Create a function to check if user is administrator
CREATE OR REPLACE FUNCTION is_admin(checking_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = checking_user_id
    AND role = 'administrator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create base policies with simple conditions
CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO authenticated
USING (
  -- Users can always view their own data
  id = auth.uid()
  OR
  -- Supervisors can view their organizers
  supervisor_id = auth.uid()
  OR
  -- Administrators can view all users
  is_admin(auth.uid())
);

CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid())
);

CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR
  is_admin(auth.uid())
);

CREATE POLICY "users_delete_policy"
ON users FOR DELETE
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Create a trigger function for role changes
CREATE OR REPLACE FUNCTION handle_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset relationships based on new role
  IF OLD.role != NEW.role THEN
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

-- Create trigger for role changes
CREATE TRIGGER role_changes_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION handle_role_changes();

-- Add constraint to prevent invalid role assignments
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role_check;
ALTER TABLE users ADD CONSTRAINT valid_role_check
  CHECK (role IN ('administrator', 'supervisor', 'organizator'));

-- Add constraint to prevent self-supervision
ALTER TABLE users DROP CONSTRAINT IF EXISTS prevent_self_supervision;
ALTER TABLE users ADD CONSTRAINT prevent_self_supervision
  CHECK (id != supervisor_id);