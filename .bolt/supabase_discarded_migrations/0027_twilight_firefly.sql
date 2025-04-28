/*
  # Update Calendar Events Policies
  
  This migration safely updates the policies for calendar_events table.
  
  1. Changes
    - Drops existing policy if exists
    - Creates new policy with improved access controls
    - Handles table existence check
  
  2. Safety
    - Checks for table existence before modifications
    - Uses DO block for conditional execution
*/

DO $$ 
BEGIN
    -- Only proceed if calendar_events table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'calendar_events') THEN
        -- Drop existing policy
        DROP POLICY IF EXISTS "Calendar events can be managed by assigned users" ON calendar_events;

        -- Create updated policy
        CREATE POLICY "Calendar events can be managed by assigned users"
            ON calendar_events FOR ALL
            TO authenticated
            USING (
                -- Allow access if any of these conditions are met:
                (
                    -- Original user access
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
                -- Allow takeover access for 'do_przejęcia' status
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
                -- Allow updates if any of these conditions are met:
                (
                    -- Original user access
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
                -- Allow takeover updates for 'do_przejęcia' status
                (
                    status = 'do_przejęcia'
                    AND EXISTS (
                        SELECT 1 FROM users
                        WHERE id = auth.uid()
                        AND active = true
                    )
                )
            );
    END IF;
END $$;