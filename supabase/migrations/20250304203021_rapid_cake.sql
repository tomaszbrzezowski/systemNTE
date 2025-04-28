/*
  # Add event comments and notifications

  1. New Tables
    - `event_comments` - Stores comments for events
    - `event_notifications` - Stores notifications for event updates

  2. Changes
    - Add comment tracking to events
    - Add notification system for event updates

  3. Security
    - Enable RLS on new tables
    - Add policies for comment and notification access
*/

-- Create event_comments table
CREATE TABLE events.event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_notifications table
CREATE TABLE events.event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('comment', 'status_change', 'assignment', 'update')),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.event_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for event_comments
CREATE POLICY "Users can view event comments"
ON events.event_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.events e
    LEFT JOIN events.event_assignments ea ON ea.event_id = e.id
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      ea.user_id = auth.uid() OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
);

CREATE POLICY "Users can manage their own comments"
ON events.event_comments
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  user_id = auth.uid() OR
  auth.jwt() ->> 'role' = 'administrator'
);

-- Create policies for event_notifications
CREATE POLICY "Users can view their notifications"
ON events.event_notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read"
ON events.event_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_event_comments_updated_at
  BEFORE UPDATE ON events.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();

CREATE TRIGGER update_event_notifications_updated_at
  BEFORE UPDATE ON events.event_notifications
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();

-- Create function to create notifications
CREATE OR REPLACE FUNCTION events.create_event_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for all assigned users
  INSERT INTO events.event_notifications (event_id, user_id, type, content)
  SELECT 
    NEW.event_id,
    ea.user_id,
    CASE
      WHEN TG_TABLE_NAME = 'event_comments' THEN 'comment'
      WHEN TG_TABLE_NAME = 'event_assignments' THEN 'assignment'
      ELSE 'update'
    END,
    CASE
      WHEN TG_TABLE_NAME = 'event_comments' THEN 'New comment added'
      WHEN TG_TABLE_NAME = 'event_assignments' THEN 'You were assigned to an event'
      ELSE 'Event was updated'
    END
  FROM events.event_assignments ea
  WHERE ea.event_id = NEW.event_id
  AND ea.user_id != auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for notifications
CREATE TRIGGER create_comment_notification
  AFTER INSERT ON events.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION events.create_event_notification();

CREATE TRIGGER create_assignment_notification
  AFTER INSERT ON events.event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION events.create_event_notification();