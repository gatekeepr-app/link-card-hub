create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

create policy "First user can claim admin"
on public.user_roles for insert to authenticated
with check (
  role = 'admin'
  and not exists (select 1 from public.user_roles where role = 'admin')
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;

create or replace function public.no_admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.user_roles where role = 'admin')
$$;

grant execute on function public.no_admin_exists() to authenticated;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slug text not null unique,
  target_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.cards to anon;
grant select, insert, update, delete on public.cards to authenticated;
grant all on public.cards to service_role;

alter table public.cards enable row level security;

create policy "Anyone can view active cards"
on public.cards for select to anon, authenticated
using (is_active = true);

create policy "Admins can view all cards"
on public.cards for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can create cards"
on public.cards for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update cards"
on public.cards for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete cards"
on public.cards for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.cards (title, subtitle, slug, target_url, sort_order) values
('Join our team', 'We are hiring — see open roles', 'hiring', 'https://forms.gle/replace-with-your-form', 0);