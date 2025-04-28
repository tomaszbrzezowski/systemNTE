/*
  # Create events schema and tables
  
  1. New Schema
    - Creates events schema for managing agreements and related data
    
  2. New Tables
    - show_titles: Stores show/performance titles
    - halls: Stores venue information
    - clients: Stores client information
    - agreements: Stores agreement details
    - agreement_performances: Stores performance details for agreements
    
  3. Security
    - Enables RLS on all tables
    - Creates appropriate policies for administrators and users
    - Adds triggers for updated_at timestamps
*/

-- Drop existing objects if they exist
do $$ 
begin
  -- Drop triggers
  drop trigger if exists update_show_titles_updated_at on events.show_titles;
  drop trigger if exists update_halls_updated_at on events.halls;
  drop trigger if exists update_clients_updated_at on events.clients;
  drop trigger if exists update_agreements_updated_at on events.agreements;
  drop trigger if exists update_agreement_performances_updated_at on events.agreement_performances;
  drop trigger if exists store_teacher_and_school_trigger on events.agreements;

  -- Drop functions
  drop function if exists events.update_updated_at_column() cascade;
  drop function if exists events.store_teacher_and_school() cascade;

  -- Drop tables
  drop table if exists events.agreement_performances cascade;
  drop table if exists events.agreements cascade;
  drop table if exists events.clients cascade;
  drop table if exists events.halls cascade;
  drop table if exists events.show_titles cascade;

  -- Drop schema
  drop schema if exists events cascade;
end $$;

-- Create schema
create schema events;

-- Create tables
create table events.show_titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table events.halls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city_name text not null,
  address text not null,
  capacity integer,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table events.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  nip text not null,
  phone text,
  email text,
  contact_person text,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table events.agreements (
  id uuid primary key default gen_random_uuid(),
  agreement_number text unique not null,
  season text not null,
  agreement_date date not null,
  school_name text not null,
  school_address text not null,
  teacher_name text not null,
  teacher_phone text not null,
  teacher_email text not null,
  hall_city_name text not null,
  hall_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table events.agreement_performances (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references events.agreements(id) on delete cascade,
  performance_date date not null,
  show_title_id uuid not null references events.show_titles(id),
  performance_time time not null,
  paid_tickets integer default 0 not null,
  unpaid_tickets integer default 0 not null,
  teacher_tickets integer default 0 not null,
  cost numeric(10,2) default 0 not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table events.show_titles enable row level security;
alter table events.halls enable row level security;
alter table events.clients enable row level security;
alter table events.agreements enable row level security;
alter table events.agreement_performances enable row level security;

-- Create updated_at function
create function events.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_show_titles_updated_at
  before update on events.show_titles
  for each row
  execute function events.update_updated_at_column();

create trigger update_halls_updated_at
  before update on events.halls
  for each row
  execute function events.update_updated_at_column();

create trigger update_clients_updated_at
  before update on events.clients
  for each row
  execute function events.update_updated_at_column();

create trigger update_agreements_updated_at
  before update on events.agreements
  for each row
  execute function events.update_updated_at_column();

create trigger update_agreement_performances_updated_at
  before update on events.agreement_performances
  for each row
  execute function events.update_updated_at_column();

-- Create RLS policies
create policy "Administrators can manage show titles" on events.show_titles
  for all to authenticated
  using (auth.jwt() ->> 'role'::text = 'administrator'::text)
  with check (auth.jwt() ->> 'role'::text = 'administrator'::text);

create policy "Authenticated users can view show titles" on events.show_titles
  for select to authenticated
  using (true);

create policy "Administrators can manage halls" on events.halls
  for all to authenticated
  using (auth.jwt() ->> 'role'::text = 'administrator'::text)
  with check (auth.jwt() ->> 'role'::text = 'administrator'::text);

create policy "Authenticated users can view halls" on events.halls
  for select to authenticated
  using (true);

create policy "Administrators can manage clients" on events.clients
  for all to authenticated
  using (auth.jwt() ->> 'role'::text = 'administrator'::text)
  with check (auth.jwt() ->> 'role'::text = 'administrator'::text);

create policy "Authenticated users can view clients" on events.clients
  for select to authenticated
  using (true);

create policy "Administrators can manage agreements" on events.agreements
  for all to authenticated
  using (auth.jwt() ->> 'role'::text = 'administrator'::text)
  with check (auth.jwt() ->> 'role'::text = 'administrator'::text);

create policy "Authenticated users can view agreements" on events.agreements
  for select to authenticated
  using (true);

create policy "Administrators can manage agreement performances" on events.agreement_performances
  for all to authenticated
  using (auth.jwt() ->> 'role'::text = 'administrator'::text)
  with check (auth.jwt() ->> 'role'::text = 'administrator'::text);

create policy "Authenticated users can view agreement performances" on events.agreement_performances
  for select to authenticated
  using (true);

-- Create function to store teacher and school info
create function events.store_teacher_and_school()
returns trigger as $$
declare
  v_school_id uuid;
  v_teacher_id uuid;
begin
  -- Insert or update school
  insert into public.schools (name, address)
  values (new.school_name, new.school_address)
  on conflict (name, address) do update
  set updated_at = now()
  returning id into v_school_id;

  -- Insert or update teacher
  insert into public.teachers (name, phone, email, school_id)
  values (new.teacher_name, new.teacher_phone, new.teacher_email, v_school_id)
  on conflict (name, phone, email) do update
  set school_id = v_school_id,
      updated_at = now()
  returning id into v_teacher_id;

  return new;
end;
$$ language plpgsql;

-- Create trigger for storing teacher and school
create trigger store_teacher_and_school_trigger
  after insert or update on events.agreements
  for each row
  execute function events.store_teacher_and_school();