-- ============================================================
-- Blackwhite — Supabase Schema
-- Run this in Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- BUSINESSES
-- ============================================================
create table businesses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  address     text,
  phone       text,
  email       text,
  tin         text,         -- TRA Tax Identification Number
  vrn         text,         -- VAT Registration Number
  logo_url    text,
  currency    text default 'TZS',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id)
);

alter table businesses enable row level security;
create policy "Users own their business" on businesses
  for all using (auth.uid() = user_id);

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses on delete cascade not null,
  name        text not null,
  phone       text,
  email       text,
  address     text,
  tin         text,
  created_at  timestamptz default now()
);

alter table clients enable row level security;
create policy "Business owns clients" on clients
  for all using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- INVOICES
-- ============================================================
create table invoices (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references businesses on delete cascade not null,
  number          text not null,              -- e.g. INV-2024-001
  client_name     text not null,
  client_phone    text,
  client_email    text,
  client_address  text,
  client_tin      text,
  items           jsonb not null default '[]',-- [{desc, qty, unit_price, amount}]
  subtotal        numeric(15,2) not null default 0,
  vat_rate        numeric(5,2) default 18,    -- 18% Tanzania VAT
  vat_amount      numeric(15,2) default 0,
  total           numeric(15,2) not null default 0,
  notes           text,
  due_date        date,
  status          text default 'draft',       -- draft|sent|paid|overdue
  payment_link    text,
  pdf_url         text,
  paid_at         timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(business_id, number)
);

alter table invoices enable row level security;
create policy "Business owns invoices" on invoices
  for all using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- PAYSLIPS
-- ============================================================
create table payslips (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references businesses on delete cascade not null,
  employee_name   text not null,
  employee_id     text,
  position        text,
  month           text not null,              -- e.g. "2024-12"
  basic_salary    numeric(15,2) not null,
  allowances      jsonb default '[]',         -- [{name, amount}]
  gross           numeric(15,2) not null,
  paye            numeric(15,2) default 0,
  nssf_employee   numeric(15,2) default 0,   -- 5% employee
  nssf_employer   numeric(15,2) default 0,   -- 5% employer
  other_deductions jsonb default '[]',        -- [{name, amount}]
  total_deductions numeric(15,2) default 0,
  net_pay         numeric(15,2) not null,
  pdf_url         text,
  created_at      timestamptz default now()
);

alter table payslips enable row level security;
create policy "Business owns payslips" on payslips
  for all using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  plan            text not null,              -- starter|business
  status          text default 'trial',       -- trial|active|expired
  trial_ends_at   timestamptz default now() + interval '14 days',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  azam_reference  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

alter table subscriptions enable row level security;
create policy "Users own their subscription" on subscriptions
  for all using (auth.uid() = user_id);

-- ============================================================
-- INVOICE NUMBER SEQUENCE HELPER
-- ============================================================
create or replace function next_invoice_number(p_business_id uuid)
returns text as $$
declare
  v_count int;
  v_year  text;
begin
  v_year := to_char(now(), 'YYYY');
  select count(*) into v_count
  from invoices
  where business_id = p_business_id
    and extract(year from created_at) = extract(year from now());
  return 'INV-' || v_year || '-' || lpad((v_count + 1)::text, 3, '0');
end;
$$ language plpgsql security definer;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on businesses
  for each row execute function handle_updated_at();
create trigger set_updated_at before update on invoices
  for each row execute function handle_updated_at();
create trigger set_updated_at before update on subscriptions
  for each row execute function handle_updated_at();

-- ============================================================
-- STORAGE BUCKETS
-- Run separately in Supabase dashboard → Storage
-- ============================================================
-- Create bucket: "documents" (public: false, 50MB limit)
-- Create bucket: "logos" (public: true, 5MB limit)

-- Then add policies:
-- documents: authenticated users can upload/read their own files
-- logos: authenticated users can upload, public can read
