create or replace function public.is_gatekeeper_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and email = 'product.gatekeepr@gmail.com'
  )
$$;

grant execute on function public.is_gatekeeper_email() to authenticated;

drop policy "First user can claim admin" on public.user_roles;

create policy "Gatekeeper email can claim admin"
on public.user_roles for insert to authenticated
with check (
  role = 'admin'
  and public.is_gatekeeper_email()
  and not exists (select 1 from public.user_roles where role = 'admin')
);