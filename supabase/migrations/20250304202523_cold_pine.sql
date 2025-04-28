/*
  # Create events schema and tables
  
  1. New Schema
    - Creates a new 'events' schema for event management
    
  2. New Tables
    - `events.event_types` - Defines different types of events
    - `events.events` - Main events table
    - `events.event_details` - Additional event details
    - `events.event_assignments` - User assignments to events
    
  3. Security
    - Enable RLS on all tables
    - Add policies for access control
*/

-- Create events schema
CREATE SCHEMA IF NOT EXISTS events;

-- Create event_types table
CREATE TABLE events.event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE events.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid REFERENCES events.event_types(id),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  city_id uuid REFERENCES public.cities(id),
  status text NOT NULL CHECK (status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_details table
CREATE TABLE events.event_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events.events(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_assignments table
CREATE TABLE events.event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'participant')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE events.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.event_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for event_types
CREATE POLICY "Admins can manage event types"
ON events.event_types
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "All users can view event types"
ON events.event_types
FOR SELECT
TO authenticated
USING (true);

-- Create policies for events
CREATE POLICY "Users can view assigned events"
ON events.events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.event_assignments ea
    WHERE ea.event_id = id AND ea.user_id = auth.uid()
  ) OR
  created_by = auth.uid() OR
  auth.jwt() ->> 'role' = 'administrator'
);

CREATE POLICY "Users can manage their own events"
ON events.events
FOR ALL
TO authenticated
USING (
  created_by = auth.uid() OR
  auth.jwt() ->> 'role' = 'administrator' OR
  EXISTS (
    SELECT 1 FROM events.event_assignments ea
    WHERE ea.event_id = id 
    AND ea.user_id = auth.uid()
    AND ea.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  auth.jwt() ->> 'role' = 'administrator' OR
  EXISTS (
    SELECT 1 FROM events.event_assignments ea
    WHERE ea.event_id = id 
    AND ea.user_id = auth.uid()
    AND ea.role IN ('owner', 'manager')
  )
);

-- Create policies for event_details
CREATE POLICY "Users can view event details"
ON events.event_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.events e
    LEFT JOIN events.event_assignments ea ON ea.event_id = e.id
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      ea.user_id = auth.uid() OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
);

CREATE POLICY "Users can manage event details"
ON events.event_details
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.events e
    LEFT JOIN events.event_assignments ea ON ea.event_id = e.id
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      (ea.user_id = auth.uid() AND ea.role IN ('owner', 'manager')) OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events.events e
    LEFT JOIN events.event_assignments ea ON ea.event_id = e.id
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      (ea.user_id = auth.uid() AND ea.role IN ('owner', 'manager')) OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
);

-- Create policies for event_assignments
CREATE POLICY "Users can view event assignments"
ON events.event_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.events e
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      auth.uid() = user_id OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
);

CREATE POLICY "Users can manage event assignments"
ON events.event_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events.events e
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events.events e
    WHERE e.id = event_id
    AND (
      e.created_by = auth.uid() OR
      auth.jwt() ->> 'role' = 'administrator'
    )
  )
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION events.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_types_updated_at
  BEFORE UPDATE ON events.event_types
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events.events
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();

CREATE TRIGGER update_event_details_updated_at
  BEFORE UPDATE ON events.event_details
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();

CREATE TRIGGER update_event_assignments_updated_at
  BEFORE UPDATE ON events.event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();