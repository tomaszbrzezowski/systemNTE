/*
  # Initial Schema Setup for New Project
  
  1. New Tables
    - users: Store user information and permissions
    - cities: Store city and voivodeship data
    - calendars: Store calendar configurations
    - calendar_events: Store calendar events and assignments
    - transfer_requests: Handle event transfers between users

  2. Security
    - Enable RLS on all tables
    - Set up appropriate access policies
    - Create secure functions for location handling
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('administrator', 'supervisor', 'organizator');
CREATE TYPE event_status AS ENUM ('wydany', 'zrobiony', 'do_przekazania', 'przekazywany', 'do_przejęcia', 'w_trakcie', 'wolne', 'niewydany');

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(calendar_id, date)
);

-- Create transfer requests table
CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES users(id) NOT NULL,
    to_user_id UUID REFERENCES users(id) NOT NULL,
    accepted BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT prevent_self_transfer CHECK (from_user_id != to_user_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cities_voivodeship ON cities(voivodeship);
CREATE INDEX idx_cities_population ON cities(population);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX idx_transfer_requests_event_id ON transfer_requests(event_id);
CREATE INDEX idx_calendars_order ON calendars("order");

-- Create location permission check function
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

-- Create location info function
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users are viewable by authenticated users"
    ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Cities are viewable by authenticated users"
    ON cities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Calendars are viewable by authenticated users"
    ON calendars FOR SELECT TO authenticated USING (true);

CREATE POLICY "Calendar events are viewable by authenticated users"
    ON calendar_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Transfer requests are viewable by involved users"
    ON transfer_requests FOR SELECT TO authenticated
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Create admin policies
CREATE POLICY "Administrators can manage all data"
    ON users FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'));

CREATE POLICY "Administrators can manage cities"
    ON cities FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'));