/*
  # Fix show titles season constraints

  1. Changes
    - Drop existing constraint if it exists
    - Add new constraint to ensure active titles have at least one season set
    - Update existing active titles to have current_season set
*/

-- First ensure all active shows have at least one season set
UPDATE show_titles 
SET current_season = true 
WHERE active = true AND NOT (current_season OR next_season);

-- Drop existing constraint if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'show_titles_season_check'
  ) THEN
    ALTER TABLE show_titles DROP CONSTRAINT show_titles_season_check;
  END IF;
END $$;

-- Now add the constraint
ALTER TABLE show_titles
ADD CONSTRAINT show_titles_season_check 
CHECK (
  (NOT active) OR 
  (active AND (current_season OR next_season))
);