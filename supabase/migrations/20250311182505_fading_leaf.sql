/*
  # Create Hall Seats Management Schema

  1. New Schema
    - Creates dedicated `hall_seats` schema
    - Adds tables for managing hall layouts and seat assignments
    - Links with public.halls table

  2. Tables
    - `hall_layouts`: Store seating layouts for halls
    - `seat_categories`: Define different seat types/categories
    - `seats`: Individual seat definitions
    - `seat_assignments`: Track seat assignments
*/

-- Create new schema
CREATE SCHEMA hall_seats;

-- Create hall_layouts table
CREATE TABLE hall_seats.hall_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES public.halls(id) ON DELETE CASCADE,
  name text NOT NULL,
  rows integer NOT NULL,
  seats_per_row integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seat_categories table
CREATE TABLE hall_seats.seat_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seats table
CREATE TABLE hall_seats.seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES hall_seats.hall_layouts(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  seat_number integer NOT NULL,
  category_id uuid REFERENCES hall_seats.seat_categories(id),
  disabled boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(layout_id, row_number, seat_number)
);

-- Create seat_assignments table
CREATE TABLE hall_seats.seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid REFERENCES hall_seats.seats(id) ON DELETE CASCADE,
  calendar_event_id uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('available', 'reserved', 'sold', 'blocked')),
  assigned_to uuid REFERENCES auth.users(id),
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seat_id, calendar_event_id)
);

-- Enable RLS
ALTER TABLE hall_seats.hall_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_seats.seat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_seats.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_seats.seat_assignments ENABLE ROW LEVEL SECURITY;

-- Create updated_at function
CREATE OR REPLACE FUNCTION hall_seats.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_hall_layouts_updated_at
  BEFORE UPDATE ON hall_seats.hall_layouts
  FOR EACH ROW
  EXECUTE FUNCTION hall_seats.update_updated_at_column();

CREATE TRIGGER update_seat_categories_updated_at
  BEFORE UPDATE ON hall_seats.seat_categories
  FOR EACH ROW
  EXECUTE FUNCTION hall_seats.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON hall_seats.seats
  FOR EACH ROW
  EXECUTE FUNCTION hall_seats.update_updated_at_column();

CREATE TRIGGER update_seat_assignments_updated_at
  BEFORE UPDATE ON hall_seats.seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION hall_seats.update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Administrators can manage hall layouts"
  ON hall_seats.hall_layouts
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view hall layouts"
  ON hall_seats.hall_layouts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage seat categories"
  ON hall_seats.seat_categories
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view seat categories"
  ON hall_seats.seat_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage seats"
  ON hall_seats.seats
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view seats"
  ON hall_seats.seats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage seat assignments"
  ON hall_seats.seat_assignments
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view seat assignments"
  ON hall_seats.seat_assignments
  FOR SELECT
  TO authenticated
  USING (true);