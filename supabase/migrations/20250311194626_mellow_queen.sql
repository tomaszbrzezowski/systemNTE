/*
  # Add event changes tracking table
  
  1. New Table
    - `event_changes`
      - Tracks changes to calendar events
      - Records status, city, and user changes
      - Links to calendar_events table
      
  2. Security
    - Enable RLS
    - Add policies for administrators
*/

-- Drop existing trigger if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'event_changes_trigger'
  ) THEN
    DROP TRIGGER event_changes_trigger ON calendar_events;
  END IF;
END $$;

-- Create event_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  old_status text,
  new_status text,
  old_city_id uuid REFERENCES cities(id),
  new_city_id uuid REFERENCES cities(id),
  old_user_id uuid REFERENCES users(id),
  new_user_id uuid REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE event_changes ENABLE ROW LEVEL SECURITY;

-- Create policy for administrators
CREATE POLICY "Administrators can manage event changes"
  ON event_changes
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

-- Create policy for viewing changes
CREATE POLICY "Users can view event changes"
  ON event_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS track_event_changes CASCADE;

-- Create trigger function to track changes
CREATE OR REPLACE FUNCTION track_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.status != NEW.status OR 
    OLD.city_id IS DISTINCT FROM NEW.city_id OR 
    OLD.user_id IS DISTINCT FROM NEW.user_id
  ) THEN
    INSERT INTO event_changes (
      event_id,
      user_id,
      old_status,
      new_status,
      old_city_id,
      new_city_id,
      old_user_id,
      new_user_id
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      OLD.city_id,
      NEW.city_id,
      OLD.user_id,
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER event_changes_trigger
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION track_event_changes();