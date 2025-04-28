-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Supervisors can view their organizers" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create new simplified policies without recursion
CREATE POLICY "Administrators can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND users.role = 'administrator'
    )
  );

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Supervisors can view assigned organizers"
  ON users FOR SELECT
  TO authenticated
  USING (
    (id = auth.uid()) OR -- Can view own data
    (
      -- Supervisors can view their organizers
      EXISTS (
        SELECT 1 FROM users supervisor
        WHERE supervisor.id = auth.uid()
        AND supervisor.role = 'supervisor'
        AND users.supervisor_id = supervisor.id
      )
    )
  );

-- Add function to maintain referential integrity
CREATE OR REPLACE FUNCTION maintain_user_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- When changing user role
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    -- If no longer a supervisor, clear organizer relationships
    IF OLD.role = 'supervisor' AND NEW.role != 'supervisor' THEN
      -- Clear supervisor references from organizers
      UPDATE users 
      SET supervisor_id = NULL,
          assigned_city_ids = '{}'
      WHERE supervisor_id = NEW.id;
      
      -- Clear organizer_ids from the supervisor
      NEW.organizer_ids := '{}';
    END IF;

    -- If becoming an organizer, clear supervisor privileges
    IF NEW.role = 'organizator' THEN
      NEW.organizer_ids := '{}';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintaining relationships
DROP TRIGGER IF EXISTS maintain_user_relationships_trigger ON users;
CREATE TRIGGER maintain_user_relationships_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION maintain_user_relationships();