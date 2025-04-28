/*
  # Set up location display functions
  
  1. Changes
    - Create function to check location viewing permissions
    - Create function to get location info with proper access control
    - Add helper functions for location display

  2. Security
    - Ensure proper access control for location data
    - Maintain data privacy based on user roles
*/

-- Create or replace location permission check function
CREATE OR REPLACE FUNCTION can_view_location(
  viewer_id UUID,
  event_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = viewer_id
    AND (
      role = 'administrator'
      OR id = event_user_id
      OR (
        role = 'supervisor'
        AND event_user_id = ANY(organizer_ids)
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace location info function
CREATE OR REPLACE FUNCTION get_event_location(
  event_id UUID,
  viewer_id UUID
) RETURNS jsonb AS $$
DECLARE
  location_data jsonb;
BEGIN
  SELECT
    CASE 
      WHEN can_view_location(viewer_id, ce.user_id) THEN
        jsonb_build_object(
          'name', c.name,
          'voivodeship', c.voivodeship,
          'show_city', true,
          'show_location', true
        )
      ELSE
        jsonb_build_object(
          'voivodeship', c.voivodeship,
          'show_city', false,
          'show_location', false
        )
    END
  INTO location_data
  FROM calendar_events ce
  LEFT JOIN cities c ON ce.city_id = c.id
  WHERE ce.id = event_id
    AND ce.status IN ('zrobiony', 'w_trakcie');

  RETURN location_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;