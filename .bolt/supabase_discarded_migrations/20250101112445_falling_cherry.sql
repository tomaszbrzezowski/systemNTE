/*
  # Fix Status Transition Validation

  1. Changes
    - Allow setting same status (idempotent updates)
    - Maintain existing valid transitions
    - Improve validation logic
    
  2. Security
    - Keep strict transition rules for status changes
    - Allow administrators to make any changes
    - Maintain data integrity
*/

-- Update status transition validation function
CREATE OR REPLACE FUNCTION auth.is_valid_status_transition(
  old_status text,
  new_status text,
  is_admin boolean
)
RETURNS boolean AS $$
BEGIN
  -- Admins can make any transition
  IF is_admin THEN
    RETURN true;
  END IF;

  -- Allow setting the same status (idempotent updates)
  IF old_status = new_status THEN
    RETURN true;
  END IF;

  -- Define allowed transitions for regular users
  RETURN CASE
    -- Initial status assignments
    WHEN old_status IS NULL AND new_status IN ('niewydany', 'do_przejęcia') THEN true
    
    -- Standard workflow transitions
    WHEN old_status = 'wydany' AND new_status IN ('w_trakcie', 'zrobiony', 'przekaz') THEN true
    WHEN old_status = 'w_trakcie' AND new_status IN ('zrobiony', 'przekaz') THEN true
    WHEN old_status = 'zrobiony' AND new_status = 'przekaz' THEN true
    
    -- Transfer-related transitions
    WHEN old_status = 'przekaz' AND new_status = 'przekazywany' THEN true
    WHEN old_status = 'do_przejęcia' AND new_status IN ('w_trakcie', 'wydany') THEN true
    
    -- Default case
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_status_transition
  ON calendar_events(status, user_id)
  WHERE status IN ('zrobiony', 'przekaz', 'przekazywany', 'do_przejęcia');