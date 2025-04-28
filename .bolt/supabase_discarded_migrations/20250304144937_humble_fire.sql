/*
  # Remove default coordinates from cities

  1. Changes
    - Sets latitude and longitude to NULL for cities that have the default Poland's center coordinates
    - Only affects cities with EXACT coordinates matching 52.069200, 19.480300
    - Preserves coordinates for all other cities

  2. Notes
    - This helps identify cities that need real coordinates vs those with placeholder values
    - Does not affect cities with actual known coordinates
*/

-- Set coordinates to NULL for cities with default center point
UPDATE cities SET
  latitude = NULL,
  longitude = NULL
WHERE 
  latitude = 52.069200 AND 
  longitude = 19.480300;