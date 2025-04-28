/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - name (text)
      - role (enum: administrator, supervisor, organizator)
      - active (boolean)
      - created_at (timestamptz)
      - assigned_city_ids (uuid[])
      - supervisor_id (uuid, references users)
      - organizer_ids (uuid[])

    - cities
      - id (uuid, primary key)
      - name (text)
      - voivodeship (text)
      - population (integer)
      - created_at (timestamptz)

    - calendars
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamptz)
      - created_by (uuid, references users)
      - order (integer)

    - calendar_events
      - id (uuid, primary key)
      - calendar_id (uuid, references calendars)
      - date (date)
      - user_id (uuid, references users)
      - city_id (uuid, references cities)
      - status (enum)
      - previous_user_id (uuid, references users)
      - to_user_id (uuid, references users)
      - transfer_status (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
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
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cities are viewable by authenticated users"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Calendars are viewable by authenticated users"
  ON calendars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Calendar events are viewable by authenticated users"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (true);

-- Create admin policies
CREATE POLICY "Administrators can manage all data"
  ON users FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ));

CREATE POLICY "Administrators can manage cities"
  ON cities FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ));

CREATE POLICY "Administrators can manage calendars"
  ON calendars FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
  ));

-- Create transfer validation function
CREATE OR REPLACE FUNCTION validate_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate przekazywany status requires to_user_id
  IF NEW.status = 'przekazywany' AND NEW.to_user_id IS NULL THEN
    RAISE EXCEPTION 'to_user_id is required for przekazywany status';
  END IF;

  -- Clear transfer data when status changes from przekazywany
  IF OLD.status = 'przekazywany' AND NEW.status != 'przekazywany' THEN
    NEW.to_user_id := NULL;
    NEW.transfer_status := NULL;
  END IF;

  -- Set initial transfer status
  IF NEW.status = 'przekazywany' AND NEW.transfer_status IS NULL THEN
    NEW.transfer_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transfer validation trigger
CREATE TRIGGER validate_transfer_trigger
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_transfer();