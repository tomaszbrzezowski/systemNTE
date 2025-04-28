/*
  # Initial Schema Setup

  1. Tables
    - users: Main users table linked to auth.users
    - cities: Cities with voivodeship and population
    - calendars: Calendar definitions with ordering
    - calendar_events: Calendar events with status tracking
  
  2. Functions
    - handle_new_user(): Creates public user record when auth user is created
    - handle_user_email_update(): Syncs email changes from auth to public schema
  
  3. Triggers
    - on_auth_user_created: Creates public user record
    - on_auth_user_email_updated: Syncs email changes
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrator', 'supervisor', 'organizator')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  assigned_city_ids uuid[] DEFAULT '{}',
  supervisor_id uuid REFERENCES public.users(id),
  organizer_ids uuid[] DEFAULT '{}'
);

-- Create cities table
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  voivodeship text NOT NULL,
  population integer,
  created_at timestamptz DEFAULT now()
);

-- Create calendars table
CREATE TABLE public.calendars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id) NOT NULL,
  "order" integer DEFAULT 0
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  user_id uuid REFERENCES public.users(id),
  city_id uuid REFERENCES public.cities(id),
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
  previous_user_id uuid REFERENCES public.users(id),
  to_user_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(calendar_id, date)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizator'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle user email updates
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email <> OLD.email THEN
    UPDATE public.users
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email updates
CREATE OR REPLACE TRIGGER on_auth_user_email_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.handle_user_email_update();

-- Create transfer validation trigger function
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
$$ LANGUAGE plpgsql;

-- Create transfer validation trigger
CREATE TRIGGER validate_calendar_event_transfer
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_event_transfer();