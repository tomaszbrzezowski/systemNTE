/*
  # Initial Schema Setup
  
  1. Tables
    - users: Stores user accounts and their roles
    - cities: Stores city information
    - calendars: Stores calendar metadata
    - calendar_events: Stores calendar events and their status
  
  2. Security
    - Enables RLS on all tables
    - Sets up policies for data access
    - Creates triggers for data validation and updates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrator', 'supervisor', 'organizator')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  assigned_city_ids uuid[] DEFAULT '{}',
  supervisor_id uuid REFERENCES users(id),
  organizer_ids uuid[] DEFAULT '{}'
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  voivodeship text NOT NULL,
  population integer,
  created_at timestamptz DEFAULT now()
);

-- Create calendars table
CREATE TABLE IF NOT EXISTS calendars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) NOT NULL,
  "order" integer DEFAULT 0
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  user_id uuid REFERENCES users(id),
  city_id uuid REFERENCES cities(id),
  status text NOT NULL CHECK (
    status IN (
      'wydany',
      'w_trakcie',
      'zrobiony',
      'do_przejęcia',
      'wolne',
      'niewydany',
      'przekaz',
      'przekazany',
      'przekazywany'
    )
  ),
  previous_user_id uuid REFERENCES users(id),
  to_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(calendar_id, date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data and assigned users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'supervisor'
      AND id = ANY(u.organizer_ids)
    )
  );

CREATE POLICY "Administrators can manage all users"
  ON users
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'administrator'
    )
  );

-- Cities policies
CREATE POLICY "Users can read assigned cities"
  ON cities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        id = ANY(u.assigned_city_ids) OR
        u.role = 'administrator'
      )
    )
  );

CREATE POLICY "Administrators can manage cities"
  ON cities
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'administrator'
    )
  );

-- Calendars policies
CREATE POLICY "Users can read all calendars"
  ON calendars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage calendars"
  ON calendars
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'administrator'
    )
  );

-- Calendar events policies
CREATE POLICY "Users can read calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own events"
  ON calendar_events
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('administrator', 'supervisor')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create transfer validation trigger
CREATE OR REPLACE FUNCTION validate_event_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-transfer
  IF NEW.status = 'przekazywany' AND NEW.user_id = NEW.to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer event to self';
  END IF;

  -- Store previous user when transferring
  IF NEW.status = 'przekazywany' AND OLD.status != 'przekazywany' THEN
    NEW.previous_user_id = OLD.user_id;
  END IF;

  -- Clear transfer data when transfer is complete
  IF NEW.status = 'przekazany' THEN
    NEW.to_user_id = NULL;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_calendar_event_transfer
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_event_transfer();