/*
  # Add new event statuses for transfers
  
  1. Changes
    - Add new status values for transfer workflow
    - Update event_status enum type
    - Add to_user_id column for tracking transfer target
  
  2. Security
    - Update RLS policies to handle transfer workflow
*/

-- Create new enum type with transfer statuses
CREATE TYPE event_status_new AS ENUM (
  'wydany',
  'w_trakcie',
  'zrobiony',
  'do_przejęcia',
  'wolne',
  'niewydany',
  'przekaz',
  'pending',
  'przekazany'
);

-- Add temporary column
ALTER TABLE calendar_events 
ADD COLUMN status_new event_status_new;

-- Update temporary column with converted values
UPDATE calendar_events
SET status_new = status::text::event_status_new;

-- Drop old column and rename new one
ALTER TABLE calendar_events DROP COLUMN status CASCADE;
ALTER TABLE calendar_events RENAME COLUMN status_new TO status;

-- Drop old enum type
DROP TYPE IF EXISTS event_status;

-- Rename new enum type to original name
ALTER TYPE event_status_new RENAME TO event_status;

-- Add to_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'to_user_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN to_user_id UUID REFERENCES users(id);
  END IF;
END $$;

-- Create index for to_user_id
CREATE INDEX IF NOT EXISTS idx_calendar_events_to_user_id 
  ON calendar_events(to_user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "calendar_events_update_policy" ON calendar_events;

CREATE POLICY "calendar_events_update_policy"
ON calendar_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      -- Administrators can update any event
      users.role = 'administrator'
      OR
      -- Users can update their own non-completed events
      (
        auth.uid() = calendar_events.user_id
        AND calendar_events.status != 'zrobiony'
      )
      OR
      -- Supervisors can update any non-completed events
      (
        users.role = 'supervisor'
        AND calendar_events.status != 'zrobiony'
      )
      OR
      -- Organizers can update any non-completed events
      (
        users.role = 'organizator'
        AND calendar_events.status != 'zrobiony'
      )
      OR
      -- Users can update events being transferred to them
      (
        calendar_events.status IN ('pending', 'przekaz')
        AND auth.uid() = calendar_events.to_user_id
      )
      OR
      -- Users can take over events marked as do_przejęcia
      calendar_events.status = 'do_przejęcia'
    )
  )
);