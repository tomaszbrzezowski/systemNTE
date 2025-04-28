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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, voivodeship)
);

-- Create calendars table
CREATE TABLE calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) NOT NULL
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transfer requests table
CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES users(id) NOT NULL,
    to_user_id UUID REFERENCES users(id) NOT NULL,
    accepted BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cities_voivodeship ON cities(voivodeship);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX idx_transfer_requests_event_id ON transfer_requests(event_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_requests_updated_at
    BEFORE UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can be created by administrators"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Users can be updated by administrators"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Cities policies
CREATE POLICY "Cities are viewable by authenticated users"
    ON cities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Cities can be created by administrators"
    ON cities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Cities can be updated by administrators"
    ON cities FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Cities can be deleted by administrators"
    ON cities FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Calendars policies
CREATE POLICY "Calendars are viewable by authenticated users"
    ON calendars FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Calendars can be created by administrators"
    ON calendars FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Calendars can be updated by administrators"
    ON calendars FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Calendars can be deleted by administrators"
    ON calendars FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Calendar events policies
CREATE POLICY "Calendar events are viewable by authenticated users"
    ON calendar_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Calendar events can be created by administrators"
    ON calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Calendar events can be created by assigned users"
    ON calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Calendar events can be updated by administrators"
    ON calendar_events FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Calendar events can be updated by owners"
    ON calendar_events FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
    );

CREATE POLICY "Calendar events can be deleted by administrators"
    ON calendar_events FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Transfer requests policies
CREATE POLICY "Transfer requests are viewable by involved users"
    ON transfer_requests FOR SELECT
    TO authenticated
    USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Transfer requests can be created by event owners"
    ON transfer_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = from_user_id
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Transfer requests can be updated by involved users"
    ON transfer_requests FOR UPDATE
    TO authenticated
    USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Create administrator account
INSERT INTO auth.users (
    email,
    raw_user_meta_data,
    created_at
) VALUES (
    't.brzezowski@nte.edu.pl',
    '{"name": "T. Brzezowski"}',
    NOW()
);

-- Get the user ID
DO $$ 
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 't.brzezowski@nte.edu.pl';
    
    -- Insert into users table
    INSERT INTO users (
        id,
        email,
        name,
        role,
        active,
        created_at
    ) VALUES (
        admin_id,
        't.brzezowski@nte.edu.pl',
        'T. Brzezowski',
        'administrator',
        true,
        NOW()
    );
END $$;