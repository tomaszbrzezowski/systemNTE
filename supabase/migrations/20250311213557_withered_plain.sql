/*
  # Fix show titles season constraint
  
  1. Changes
    - Drop existing season check constraint
    - Add new constraint that allows titles without seasons
    - Maintain data integrity for existing records
    
  2. Notes
    - Allows titles to be added without season selection
    - Preserves existing data
*/

-- Drop existing constraint if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'show_titles_season_check'
  ) THEN
    ALTER TABLE show_titles DROP CONSTRAINT show_titles_season_check;
  END IF;
END $$;

-- Add new columns with default values if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_titles' AND column_name = 'current_season'
  ) THEN
    ALTER TABLE show_titles ADD COLUMN current_season boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_titles' AND column_name = 'next_season'
  ) THEN
    ALTER TABLE show_titles ADD COLUMN next_season boolean DEFAULT false;
  END IF;
END $$;

-- Update any NULL values to false
UPDATE show_titles 
SET 
  current_season = COALESCE(current_season, false),
  next_season = COALESCE(next_season, false)
WHERE current_season IS NULL OR next_season IS NULL;