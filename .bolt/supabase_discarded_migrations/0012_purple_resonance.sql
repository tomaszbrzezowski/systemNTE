/*
  # Update Location Display Logic

  1. Changes
    - Add function to handle location display based on user role and permissions
    - Update RLS policies for location visibility
    - Add helper functions for location display logic

  2. Security
    - Maintain existing RLS policies
    - Add role-based location access control
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

-- Update calendar_events view to include location display logic
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

-- Refresh existing policies
DO $$ 
BEGIN
  -- Verify and refresh calendar_events policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Calendar events can be managed by assigned users'
  ) THEN
    -- Drop and recreate to ensure latest version
    DROP POLICY "Calendar events can be managed by assigned users" ON calendar_events;
  END IF;

  -- Recreate policy with updated conditions
  CREATE POLICY "Calendar events can be managed by assigned users"
    ON calendar_events FOR ALL
    TO authenticated
    USING (
      (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND (
            role = 'supervisor'
            OR role = 'organizator'
          )
        )
      )
      OR
      (
        status = 'do_przejęcia'
        AND EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND active = true
        )
      )
    )
    WITH CHECK (
      (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND (
            role = 'supervisor'
            OR role = 'organizator'
          )
        )
      )
      OR
      (
        status = 'do_przejęcia'
        AND EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND active = true
        )
      )
    );
END $$;