/*
  # Initial Database Setup

  1. Tables
    - users: User accounts and roles
    - cities: City information
    - calendars: Calendar containers
    - calendar_events: Calendar event entries
    - transfer_requests: Event transfer tracking

  2. Functions & Triggers
    - Updated timestamp management
    - Status change validation
    - Transfer request handling
    - User role management

  3. Row Level Security
    - User-based access control
    - Role-based permissions
    - Event management rules
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('administrator', 'supervisor', 'organizator');
CREATE TYPE event_status AS ENUM (
  'wydany',
  'zrobiony', 
  'do_przekazania',
  'przekazywany',
  'do_przejęcia',
  'w_trakcie',
  'wolne',
  'niewydany'
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'organizator',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_city_ids UUID[] DEFAULT '{}',
  supervisor_id UUID REFERENCES users(id),
  organizer_ids UUID[] DEFAULT '{}'
);

-- Create cities table
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  voivodeship TEXT NOT NULL,
  population INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, voivodeship)
);

-- Create calendars table
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) NOT NULL,
  "order" INTEGER DEFAULT 0
);

-- Create calendar events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES users(id),
  city_id UUID REFERENCES cities(id),
  status event_status NOT NULL DEFAULT 'niewydany',
  previous_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  transfer_status TEXT CHECK (
    transfer_status IN ('pending', 'accepted', 'rejected') OR transfer_status IS NULL
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendar_id, date)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_supervisor_id ON users(supervisor_id);
CREATE INDEX idx_users_organizer_ids ON users USING GIN(organizer_ids);
CREATE INDEX idx_users_assigned_city_ids ON users USING GIN(assigned_city_ids);
CREATE INDEX idx_cities_voivodeship ON cities(voivodeship);
CREATE INDEX idx_cities_population ON cities(population);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_to_user_id ON calendar_events(to_user_id);
CREATE INDEX idx_calendar_events_transfer_status ON calendar_events(transfer_status);
CREATE INDEX idx_calendars_order ON calendars("order");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to calendar_events
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create status validation function
CREATE OR REPLACE FUNCTION validate_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user role
  DECLARE
    user_role text;
  BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = auth.uid();

    -- Validate status changes based on role
    IF user_role IN ('supervisor', 'organizator') THEN
      -- Check if new status is allowed
      IF NEW.status NOT IN ('zrobiony', 'do_przekazania', 'do_przejęcia', 'w_trakcie') THEN
        RAISE EXCEPTION 'Invalid status change for role %', user_role;
      END IF;

      -- Check specific status change rules
      IF OLD.status = 'wydany' AND NEW.status NOT IN ('w_trakcie', 'do_przekazania') THEN
        RAISE EXCEPTION 'Invalid status change from wydany';
      END IF;

      IF OLD.status = 'w_trakcie' AND NEW.status NOT IN ('zrobiony', 'do_przekazania') THEN
        RAISE EXCEPTION 'Invalid status change from w_trakcie';
      END IF;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create status validation trigger
CREATE TRIGGER validate_status_change_trigger
  BEFORE UPDATE OF status ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_change();

-- Create user role change function
CREATE OR REPLACE FUNCTION handle_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset relationships based on new role
  IF OLD.role != NEW.role THEN
    CASE NEW.role
      WHEN 'organizator' THEN
        NEW.organizer_ids := '{}';
        NEW.supervisor_id := NULL;
      WHEN 'supervisor' THEN
        NEW.supervisor_id := NULL;
      WHEN 'administrator' THEN
        NEW.supervisor_id := NULL;
        NEW.organizer_ids := '{}';
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create role changes trigger
CREATE TRIGGER role_changes_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION handle_role_changes();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create users policies
CREATE POLICY "users_select_policy"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON u.id = au.id
      WHERE au.id = auth.uid()
      AND u.role = 'administrator'
    )
    OR supervisor_id = auth.uid()
  );

CREATE POLICY "users_insert_policy"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON u.id = au.id
      WHERE au.id = auth.uid()
      AND u.role = 'administrator'
    )
  );

CREATE POLICY "users_update_policy"
  ON users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON u.id = au.id
      WHERE au.id = auth.uid()
      AND u.role = 'administrator'
    )
  );

-- Create cities policies
CREATE POLICY "cities_select_policy"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cities_admin_policy"
  ON cities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- Create calendars policies
CREATE POLICY "calendars_select_policy"
  ON calendars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "calendars_admin_policy"
  ON calendars FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
  );

-- Create calendar events policies
CREATE POLICY "calendar_events_select_policy"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "calendar_events_manage_policy"
  ON calendar_events FOR ALL
  TO authenticated
  USING (
    -- User can manage their own events
    user_id = auth.uid()
    OR
    -- Administrators can manage all events
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'administrator'
    )
    OR
    -- Supervisors can manage their organizers' events
    EXISTS (
      SELECT 1 FROM users supervisor
      WHERE supervisor.id = auth.uid()
      AND supervisor.role = 'supervisor'
      AND calendar_events.user_id = ANY(supervisor.organizer_ids)
    )
    OR
    -- Anyone can take over events marked as 'do_przejęcia'
    (
      status = 'do_przejęcia'
      AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND active = true
      )
    )
  );

-- Add constraints
ALTER TABLE users 
  ADD CONSTRAINT prevent_self_supervision 
  CHECK (id != supervisor_id);

ALTER TABLE calendar_events
  ADD CONSTRAINT valid_status_transition
  CHECK (
    status IN ('wydany', 'zrobiony', 'do_przekazania', 'przekazywany', 
               'do_przejęcia', 'w_trakcie', 'wolne', 'niewydany')
  );