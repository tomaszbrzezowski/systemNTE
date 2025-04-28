/*
  # Clean up city coordinates

  This migration removes hardcoded coordinates and sets default values for all cities.
  Cities will have their coordinates updated through the UI using the EditCoordinatesModal.

  1. Changes
    - Reset all city coordinates to Poland's center point
    - Remove hardcoded coordinate values
    - Maintain NOT NULL constraints with defaults

  2. Security
    - No changes to existing RLS policies
*/

-- Set all coordinates to Poland's center point
UPDATE cities SET
  latitude = 52.0692,   -- Poland's center latitude
  longitude = 19.4803;  -- Poland's center longitude