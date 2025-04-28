/*
  # Update location display permissions

  1. Changes
    - Add helper function to determine location display permissions
    - Add view for location display with permission checks
    - Update calendar events policies

  2. Security
    - Only show full location details to:
      - Administrators
      - Users viewing their own events
      - Supervisors viewing their organizers' events
    - Others only see voivodeship information
*/

-- Create helper function for location display permissions
CREATE OR REPLACE FUNCTION can_view_full_location(
  viewer_id UUID,
  event_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = viewer_id
    AND (
      -- Admins can see all locations
      role = 'administrator'
      -- Users can see their own locations
      OR id = event_user_id
      -- Supervisors can see their organizers' locations
      OR (
        role = 'supervisor'
        AND event_user_id = ANY(organizer_ids)
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for location display
CREATE OR REPLACE VIEW calendar_events_with_location AS
SELECT 
  ce.*,
  CASE 
    WHEN can_view_full_location(auth.uid(), ce.user_id) THEN
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
  END as location_info
FROM 
  calendar_events ce
  LEFT JOIN cities c ON ce.city_id = c.id
WHERE 
  ce.status IN ('zrobiony', 'w_trakcie');

-- Add policy for location view
CREATE POLICY "Users can view locations based on role"
  ON calendar_events_with_location
  FOR SELECT
  TO authenticated
  USING (true);