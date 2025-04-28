/*
  # Add season management to show titles

  1. Changes
    - Add current_season and next_season boolean fields to show_titles table
    - Set default values for new fields
    - Add check constraint to ensure at least one season is selected for active shows
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add the new columns without constraint
ALTER TABLE show_titles 
ADD COLUMN current_season boolean DEFAULT false,
ADD COLUMN next_season boolean DEFAULT false;

-- Update existing active shows to be in current season
-- Do this before adding the constraint
UPDATE show_titles 
SET current_season = true 
WHERE active = true;

-- Now add the constraint after data is properly set
ALTER TABLE show_titles
ADD CONSTRAINT show_titles_season_check 
CHECK (
  (active = false) OR 
  (active = true AND (current_season = true OR next_season = true))
);