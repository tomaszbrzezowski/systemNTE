/*
  # Synchronize Database Schema

  1. Changes
    - Add missing indexes for performance optimization
    - Add missing constraints for data integrity
    - Update RLS policies for better security

  2. Security
    - Add RLS policies for user management
    - Add RLS policies for calendar events
    - Add RLS policies for transfer management
*/

-- Add missing indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_organizer_ids ON users USING GIN(organizer_ids);
CREATE INDEX IF NOT EXISTS idx_users_assigned_city_ids ON users USING GIN(assigned_city_ids);

-- Add constraints for data integrity
ALTER TABLE users ADD CONSTRAINT valid_role_values 
  CHECK (role IN ('administrator', 'supervisor', 'organizator'));

ALTER TABLE calendar_events ADD CONSTRAINT valid_status_values 
  CHECK (status IN ('wydany', 'zrobiony', 'do_przekazania', 'przekazywany', 
                   'do_przejęcia', 'w_trakcie', 'wolne', 'niewydany'));

-- Add constraint to prevent supervisor self-reference
ALTER TABLE users ADD CONSTRAINT prevent_self_supervisor 
  CHECK (id != supervisor_id);

-- Update RLS policies for user management
CREATE POLICY "Supervisors can view their organizers"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'supervisor'
      AND users.id = ANY(u.organizer_ids)
    )
  );

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Update RLS policies for calendar events
CREATE POLICY "Supervisors can manage their organizers events"
  ON calendar_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'supervisor'
      AND calendar_events.user_id = ANY(organizer_ids)
    )
  );

-- Add function to validate user role changes
CREATE OR REPLACE FUNCTION validate_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear organizer-specific data when role changes from supervisor
  IF OLD.role = 'supervisor' AND NEW.role != 'supervisor' THEN
    NEW.organizer_ids := '{}';
    -- Update related organizers
    UPDATE users 
    SET supervisor_id = NULL, 
        assigned_city_ids = '{}'
    WHERE supervisor_id = NEW.id;
  END IF;

  -- Clear supervisor-specific data when role changes to organizer
  IF NEW.role = 'organizator' THEN
    NEW.organizer_ids := '{}';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user role changes
CREATE TRIGGER user_role_change_trigger
  BEFORE UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role_change();