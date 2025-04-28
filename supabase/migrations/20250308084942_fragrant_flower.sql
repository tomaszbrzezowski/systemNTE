/*
  # Fix event changes query relationships

  1. Changes
    - Add explicit names for foreign key relationships to users table
    - Update RLS policy to use auth.uid()
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policy with corrected syntax
*/

-- Drop existing foreign key constraints
ALTER TABLE event_changes 
  DROP CONSTRAINT IF EXISTS event_changes_user_id_fkey,
  DROP CONSTRAINT IF EXISTS event_changes_old_user_id_fkey,
  DROP CONSTRAINT IF EXISTS event_changes_new_user_id_fkey;

-- Recreate foreign key constraints with explicit names
ALTER TABLE event_changes
  ADD CONSTRAINT event_changes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id),
  ADD CONSTRAINT event_changes_old_user_id_fkey 
    FOREIGN KEY (old_user_id) REFERENCES users(id),
  ADD CONSTRAINT event_changes_new_user_id_fkey 
    FOREIGN KEY (new_user_id) REFERENCES users(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_changes_event_id ON event_changes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_changes_changed_at ON event_changes(changed_at DESC);

-- Update RLS policy to use auth.uid() and subquery
DROP POLICY IF EXISTS "Administrators can read event changes" ON event_changes;

CREATE POLICY "Administrators can read event changes" 
  ON event_changes
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'administrator'
  ));