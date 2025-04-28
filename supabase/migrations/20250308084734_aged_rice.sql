/*
  # Add event changes tracking

  1. New Tables
    - `event_changes`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references calendar_events)
      - `user_id` (uuid, references users)
      - `changed_at` (timestamp)
      - `old_status` (text)
      - `new_status` (text)
      - `old_city_id` (uuid)
      - `new_city_id` (uuid)
      - `old_user_id` (uuid)
      - `new_user_id` (uuid)
      
  2. Security
    - Enable RLS on `event_changes` table
    - Add policy for administrators to read event changes
*/

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

ALTER TABLE event_changes ENABLE ROW LEVEL SECURITY;

-- Create policy using auth.uid() and subquery to check role
CREATE POLICY "Administrators can read event changes" 
  ON event_changes
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'administrator'
  ));

-- Create trigger function to track changes
CREATE OR REPLACE FUNCTION track_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status != NEW.status OR 
      OLD.city_id != NEW.city_id OR 
      OLD.user_id != NEW.user_id) THEN
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
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER event_changes_trigger
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION track_event_changes();