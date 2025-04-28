/*
  # Update city coordinates

  1. Changes
    - Set default coordinates for any cities missing them
*/

-- Set default coordinates for any cities that don't have them
UPDATE cities SET
  latitude = COALESCE(latitude, 52.0692),
  longitude = COALESCE(longitude, 19.4803)
WHERE latitude IS NULL OR longitude IS NULL;