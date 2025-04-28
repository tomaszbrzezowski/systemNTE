/*
  # Add RLS policies for event changes

  1. Changes
    - Enable RLS on event_changes table
    - Add policies for:
      - Administrators can manage all event changes
      - Authenticated users can insert event changes
      - Users can view changes for their events
      
  2. Security
    - Enable RLS on event_changes table
    - Add appropriate policies for different user roles
*/

-- Enable RLS
ALTER TABLE event_changes ENABLE ROW LEVEL SECURITY;

-- Allow administrators to manage all event changes
CREATE POLICY "Administrators can manage event changes"
  ON event_changes
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'administrator'
  );

-- Allow authenticated users to insert event changes
CREATE POLICY "Users can insert event changes"
  ON event_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view changes for their events
CREATE POLICY "Users can view their event changes"
  ON event_changes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    old_user_id = auth.uid() OR
    new_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM calendar_events
      WHERE calendar_events.id = event_changes.event_id
      AND (
        calendar_events.user_id = auth.uid() OR
        calendar_events.previous_user_id = auth.uid() OR
        calendar_events.to_user_id = auth.uid()
      )
    )
  );