-- ============================================================
-- Blackwhite — Supabase Schema
-- Run this in Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

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
  nssf_employee   numeric(15,2) default 0,   -- configurable employee pension contribution
  nssf_employer   numeric(15,2) default 0,   -- configurable employer pension contribution
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
-- USAGE PAYMENTS
-- ============================================================
create table usage_payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users on delete cascade not null,
  business_id         uuid references businesses on delete cascade not null,
  document_type       text not null check (document_type in ('invoice', 'payslip', 'document')),
  document_id         uuid,
  request_type        text not null check (
    request_type in ('invoice_pdf', 'payslip_pdf', 'whatsapp_share', 'document_generation')
  ),
  provider            text not null default 'mongike',
  gateway_ref         text,
  provider_payment_id text,
  order_id            text not null unique,
  status              text,
  amount              numeric(15,2) not null default 2000,
  currency            text not null default 'TZS',
  expires_at          timestamptz,
  metadata            jsonb not null default '{}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table usage_payments enable row level security;
create policy "Users own their usage payments" on usage_payments
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- TAX SETTINGS
-- ============================================================
create table tax_settings (
  id                            uuid primary key default gen_random_uuid(),
  business_id                   uuid references businesses on delete cascade not null unique,
  vat_registered                boolean not null default false,
  vat_rate                      numeric(5,2) not null default 18,
  vat_registration_threshold    numeric(15,2) not null default 200000000,
  income_tax_rate               numeric(5,2) not null default 30,
  sdl_rate                      numeric(5,2) not null default 3.5,
  sdl_employee_threshold        integer not null default 10,
  nssf_employee_rate            numeric(5,2) not null default 10,
  nssf_employer_rate            numeric(5,2) not null default 10,
  paye_due_day                  integer not null default 7,
  vat_due_day                   integer not null default 20,
  income_tax_installment_months integer[] not null default array[3, 6, 9, 12],
  paye_brackets                 jsonb not null default '[
    {"over":0,"notOver":270000,"baseTax":0,"rate":0},
    {"over":270000,"notOver":520000,"baseTax":0,"rate":8},
    {"over":520000,"notOver":760000,"baseTax":20000,"rate":20},
    {"over":760000,"notOver":1000000,"baseTax":68000,"rate":25},
    {"over":1000000,"notOver":null,"baseTax":128000,"rate":30}
  ]',
  source_note                   text,
  created_at                    timestamptz default now(),
  updated_at                    timestamptz default now()
);

alter table tax_settings enable row level security;
create policy "Business owns tax settings" on tax_settings
  for all using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- ============================================================
-- TAX ENTRIES
-- ============================================================
create table tax_entries (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid references businesses on delete cascade not null,
  entry_date            date not null,
  period_type           text not null default 'daily' check (period_type in ('daily', 'monthly')),
  sales_vat_exclusive   numeric(15,2) not null default 0,
  exempt_sales          numeric(15,2) not null default 0,
  deductible_expenses   numeric(15,2) not null default 0,
  input_vat             numeric(15,2) not null default 0,
  payroll_gross         numeric(15,2) not null default 0,
  paye_withheld         numeric(15,2) not null default 0,
  employee_count        integer not null default 0,
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index tax_entries_business_date_idx on tax_entries (business_id, entry_date desc);

alter table tax_entries enable row level security;
create policy "Business owns tax entries" on tax_entries
  for all using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

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
create trigger set_updated_at before update on usage_payments
  for each row execute function handle_updated_at();
create trigger set_updated_at before update on tax_settings
  for each row execute function handle_updated_at();
create trigger set_updated_at before update on tax_entries
  for each row execute function handle_updated_at();

-- ============================================================
-- STORAGE BUCKETS
-- Run separately in Supabase dashboard → Storage
-- ============================================================
-- Create bucket: "documents" (public: true, 50MB limit)
-- Create bucket: "business-logos" (public: true, 5MB limit)

-- Then add policies:
-- documents: public read; authenticated users can upload/update their own generated PDFs
-- business-logos: public read; authenticated users can upload/update their own logo path
-- If you already have the old "logos" bucket, keep it temporarily only for migration.
