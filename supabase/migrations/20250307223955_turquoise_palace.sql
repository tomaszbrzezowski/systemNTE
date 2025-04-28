/*
  # Update show titles seasons

  1. Changes
    - Update existing active shows to ensure they have at least one season assigned
    - No schema changes needed since columns and constraint already exist
    
  2. Security
    - No changes to RLS policies required
*/

-- Update existing active shows to be in current season if no season is set
UPDATE show_titles 
SET current_season = true 
WHERE active = true 
AND NOT (current_season OR next_season);