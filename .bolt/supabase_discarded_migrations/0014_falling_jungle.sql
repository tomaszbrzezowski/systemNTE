/*
  # Fix location display implementation
  
  1. Changes
    - Remove view-based approach
    - Add function to get location info directly
    - Update calendar events policies

  2. Security
    - Maintain same permission rules through functions
    - Ensure data access control at the database level
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS calendar_events_with_location;

-- Create function to get location info
CREATE OR REPLACE FUNCTION get_location_info(
  event_id UUID,
  viewer_id UUID
) RETURNS jsonb AS $$
DECLARE
  location_info jsonb;
BEGIN
  SELECT
    CASE 
      WHEN can_view_full_location(viewer_id, ce.user_id) THEN
        jsonb_build_object(
          'name', c.name,
          'voivodeship', c.voivodeship,
          'show_full', true
        )
      ELSE
        jsonb_build_object(
          'voivodeship', c.voivodeship,
          'show_full', false
        )
    END
  INTO location_info
  FROM calendar_events ce
  LEFT JOIN cities c ON ce.city_id = c.id
  WHERE ce.id = event_id
    AND ce.status IN ('zrobiony', 'w_trakcie');

  RETURN location_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update calendar events policy to include location info
CREATE OR REPLACE FUNCTION get_calendar_event_with_location(event_id UUID)
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'event', row_to_json(ce.*),
      'location', get_location_info(ce.id, auth.uid())
    )
    FROM calendar_events ce
    WHERE ce.id = event_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;