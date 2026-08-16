-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists products (
  id integer primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10, 2) not null,
  "imageUrl" text not null default '',
  category text not null default 'general',
  stock integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  items jsonb not null default '[]'::jsonb,
  customer jsonb not null default '{}'::jsonb,
  total numeric(10, 2) not null default 0,
  status text not null default 'placed',
  "createdAt" timestamptz not null default now()
);

alter table products enable row level security;
alter table orders enable row level security;

drop policy if exists "products_all" on products;
create policy "products_all"
  on products
  for all
  using (true)
  with check (true);

drop policy if exists "orders_all" on orders;
create policy "orders_all"
  on orders
  for all
  using (true)
  with check (true);
