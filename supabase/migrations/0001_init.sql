-- Notice initial schema

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  google_access_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  original_url text not null,
  title text,
  summary text,
  status text not null default 'unread',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_completed boolean not null default false,
  show_on_lock_screen boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_folders_user_id on public.folders(user_id);
create index if not exists idx_links_folder_id on public.links(folder_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
