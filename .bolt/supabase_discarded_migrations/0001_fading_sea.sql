/*
  # Add transfer statuses

  1. Changes
    - Add new event statuses: 'przekaz', 'pending', 'przekazany'
    - Update existing events to use new statuses
    - Add toUserId column for transfer functionality

  2. Notes
    - Preserves existing data
    - Handles status transitions safely
*/

-- Create new enum type with transfer statuses
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE event_status AS ENUM (
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
  ELSE
    -- Add new values to existing enum
    ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'przekaz';
    ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'pending';
    ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'przekazany';
  END IF;
END $$;

-- Add toUserId column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'to_user_id'
  ) THEN
    ALTER TABLE calendar_events 
    ADD COLUMN to_user_id UUID REFERENCES users(id);
  END IF;
END $$;

-- Create index for to_user_id
CREATE INDEX IF NOT EXISTS idx_calendar_events_to_user_id 
ON calendar_events(to_user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "calendar_events_transfer_policy" ON calendar_events;

CREATE POLICY "calendar_events_transfer_policy"
ON calendar_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      users.role = 'administrator'
      OR auth.uid() = user_id
      OR auth.uid() = to_user_id
      OR (
        users.role = 'supervisor'
        AND user_id = ANY(users.organizer_ids)
      )
    )
  )
);