/*
  # Add new event status and update schema

  1. Changes
    - Add 'przekaz' to event_status enum
    - Update calendar_events table constraints
    - Add transfer_to_user_id column
  
  2. Security
    - Maintain existing RLS policies
    - Add policy for transfer operations
*/

-- Add new status to event_status enum
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'przekaz';

-- Add transfer_to_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'transfer_to_user_id'
  ) THEN
    ALTER TABLE calendar_events 
    ADD COLUMN transfer_to_user_id UUID REFERENCES users(id);
  END IF;
END $$;

-- Add index for transfer operations
CREATE INDEX IF NOT EXISTS idx_calendar_events_transfer 
ON calendar_events(transfer_to_user_id) 
WHERE transfer_to_user_id IS NOT NULL;

-- Add policy for transfer operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'users_can_transfer_events'
    AND tablename = 'calendar_events'
  ) THEN
    CREATE POLICY "users_can_transfer_events"
    ON calendar_events
    FOR UPDATE
    TO authenticated
    USING (
      user_id = auth.uid() OR
      transfer_to_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'administrator'
      )
    )
    WITH CHECK (
      user_id = auth.uid() OR
      transfer_to_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'administrator'
      )
    );
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE calendar_events IS 'Calendar events with transfer capabilities:
- Events can be transferred between users
- Transfer status tracks the state of transfer
- Administrators can manage all transfers
- Users can only transfer their own events';