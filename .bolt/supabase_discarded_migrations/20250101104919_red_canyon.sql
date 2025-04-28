-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR                                    -- Own profile
    role = 'administrator' OR                             -- Admins see all
    (role = 'supervisor' AND                             -- Supervisors see their organizers
      EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = users.id 
        AND (u.supervisor_id = auth.uid() OR u.id = ANY(ARRAY(SELECT unnest(organizer_ids) FROM users WHERE id = auth.uid())))
      ))
  );

CREATE POLICY "Only administrators can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (role = 'administrator');

CREATE POLICY "Users can update their own data, admins can update any"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'administrator')
  WITH CHECK (auth.uid() = id OR role = 'administrator');

-- Calendars table policies
CREATE POLICY "Anyone can view calendars"
  ON calendars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only administrators can manage calendars"
  ON calendars
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'administrator'
    )
  );

-- Calendar events policies
CREATE POLICY "Users can view calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR                              -- Own events
    EXISTS (                                             -- Admin or supervisor
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        role = 'administrator' OR
        (role = 'supervisor' AND (
          user_id = ANY(ARRAY(SELECT unnest(organizer_ids) FROM users WHERE id = auth.uid())) OR
          user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can insert events based on role"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        role = 'administrator' OR
        role = 'supervisor' OR
        (role = 'organizator' AND status IN ('w_trakcie', 'zrobiony', 'do_przejęcia'))
      )
    )
  );

-- Cities table policies
CREATE POLICY "Anyone can view cities"
  ON cities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only administrators can manage cities"
  ON cities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'administrator'
    )
  );