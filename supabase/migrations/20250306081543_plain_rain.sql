/*
  # Create events schema and related tables

  1. New Schema
    - Creates dedicated `events` schema for better organization
    - Sets up tables for agreements, clients, and halls
    - Sets up proper RLS policies and security

  2. Tables
    - `events.show_titles`: Available show titles
    - `events.halls`: Performance venue information
    - `events.clients`: Client/school information
    - `events.agreements`: Performance agreements
    - `events.agreement_performances`: Individual performances

  3. Security
    - Enable RLS on all tables
    - Only administrators can manage data
    - Authenticated users can view data
*/

-- Create new schema
create schema if not exists events;

-- Create show_titles table first since it's referenced by others
create table if not exists events.show_titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create halls table
create table if not exists events.halls (
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

-- Create clients table
create table if not exists events.clients (
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

-- Create agreements table
create table if not exists events.agreements (
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

-- Create agreement_performances table
create table if not exists events.agreement_performances (
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

-- Drop existing policies if they exist
do $$
begin
  -- Drop show_titles policies
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'show_titles' 
    and policyname = 'Show titles admin access'
  ) then
    drop policy "Show titles admin access" on events.show_titles;
  end if;
  
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'show_titles' 
    and policyname = 'Show titles view access'
  ) then
    drop policy "Show titles view access" on events.show_titles;
  end if;

  -- Drop halls policies
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'halls' 
    and policyname = 'Halls admin access'
  ) then
    drop policy "Halls admin access" on events.halls;
  end if;
  
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'halls' 
    and policyname = 'Halls view access'
  ) then
    drop policy "Halls view access" on events.halls;
  end if;

  -- Drop clients policies
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'clients' 
    and policyname = 'Clients admin access'
  ) then
    drop policy "Clients admin access" on events.clients;
  end if;
  
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'clients' 
    and policyname = 'Clients view access'
  ) then
    drop policy "Clients view access" on events.clients;
  end if;

  -- Drop agreements policies
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'agreements' 
    and policyname = 'Agreements admin access'
  ) then
    drop policy "Agreements admin access" on events.agreements;
  end if;
  
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'agreements' 
    and policyname = 'Agreements view access'
  ) then
    drop policy "Agreements view access" on events.agreements;
  end if;

  -- Drop agreement_performances policies
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'agreement_performances' 
    and policyname = 'Agreement performances admin access'
  ) then
    drop policy "Agreement performances admin access" on events.agreement_performances;
  end if;
  
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and tablename = 'agreement_performances' 
    and policyname = 'Agreement performances view access'
  ) then
    drop policy "Agreement performances view access" on events.agreement_performances;
  end if;
end $$;

-- Create policies for show_titles
create policy "Show titles admin access" on events.show_titles
  to authenticated
  using (auth.jwt() ->> 'role' = 'administrator')
  with check (auth.jwt() ->> 'role' = 'administrator');

create policy "Show titles view access" on events.show_titles
  for select to authenticated
  using (true);

-- Create policies for halls
create policy "Halls admin access" on events.halls
  to authenticated
  using (auth.jwt() ->> 'role' = 'administrator')
  with check (auth.jwt() ->> 'role' = 'administrator');

create policy "Halls view access" on events.halls
  for select to authenticated
  using (true);

-- Create policies for clients
create policy "Clients admin access" on events.clients
  to authenticated
  using (auth.jwt() ->> 'role' = 'administrator')
  with check (auth.jwt() ->> 'role' = 'administrator');

create policy "Clients view access" on events.clients
  for select to authenticated
  using (true);

-- Create policies for agreements
create policy "Agreements admin access" on events.agreements
  to authenticated
  using (auth.jwt() ->> 'role' = 'administrator')
  with check (auth.jwt() ->> 'role' = 'administrator');

create policy "Agreements view access" on events.agreements
  for select to authenticated
  using (true);

-- Create policies for agreement_performances
create policy "Agreement performances admin access" on events.agreement_performances
  to authenticated
  using (auth.jwt() ->> 'role' = 'administrator')
  with check (auth.jwt() ->> 'role' = 'administrator');

create policy "Agreement performances view access" on events.agreement_performances
  for select to authenticated
  using (true);

-- Create updated_at function if it doesn't exist
create or replace function events.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop existing triggers if they exist
do $$
declare
  trigger_exists boolean;
begin
  -- Check and drop show_titles trigger
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'show_titles'
    and trigger_name = 'update_show_titles_updated_at'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger update_show_titles_updated_at on events.show_titles;
  end if;

  -- Check and drop halls trigger
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'halls'
    and trigger_name = 'update_halls_updated_at'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger update_halls_updated_at on events.halls;
  end if;

  -- Check and drop clients trigger
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'clients'
    and trigger_name = 'update_clients_updated_at'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger update_clients_updated_at on events.clients;
  end if;

  -- Check and drop agreements trigger
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'agreements'
    and trigger_name = 'update_agreements_updated_at'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger update_agreements_updated_at on events.agreements;
  end if;

  -- Check and drop agreement_performances trigger
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'agreement_performances'
    and trigger_name = 'update_agreement_performances_updated_at'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger update_agreement_performances_updated_at on events.agreement_performances;
  end if;
end $$;

-- Create triggers
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

-- Create function to store teacher and school info
create or replace function events.store_teacher_and_school()
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

-- Drop existing trigger if it exists
do $$
declare
  trigger_exists boolean;
begin
  select exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'events'
    and event_object_table = 'agreements'
    and trigger_name = 'store_teacher_and_school_trigger'
  ) into trigger_exists;
  
  if trigger_exists then
    drop trigger store_teacher_and_school_trigger on events.agreements;
  end if;
end $$;

-- Create trigger for storing teacher and school
create trigger store_teacher_and_school_trigger
  after insert or update on events.agreements
  for each row
  execute function events.store_teacher_and_school();

-- Drop existing anonymous access policies
do $$
begin
  if exists (
    select 1 from pg_policies 
    where schemaname = 'events' 
    and policyname = 'Block anonymous access'
  ) then
    drop policy "Block anonymous access" on events.show_titles;
    drop policy "Block anonymous access" on events.halls;
    drop policy "Block anonymous access" on events.clients;
    drop policy "Block anonymous access" on events.agreements;
    drop policy "Block anonymous access" on events.agreement_performances;
  end if;
end $$;

-- Create anonymous access policies
create policy "Block anonymous access" on events.show_titles for all to public using (auth.role() = 'authenticated');
create policy "Block anonymous access" on events.halls for all to public using (auth.role() = 'authenticated');
create policy "Block anonymous access" on events.clients for all to public using (auth.role() = 'authenticated');
create policy "Block anonymous access" on events.agreements for all to public using (auth.role() = 'authenticated');
create policy "Block anonymous access" on events.agreement_performances for all to public using (auth.role() = 'authenticated');