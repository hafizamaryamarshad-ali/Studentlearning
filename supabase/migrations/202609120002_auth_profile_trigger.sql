begin;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if char_length(requested_name) < 1 or char_length(requested_name) > 120 then
    raise exception 'A valid full name is required';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    requested_name,
    lower(new.email),
    'student'::public.user_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- The trigger hardcodes the student role. Admin access must be granted later
-- by a trusted database or administrator process, never from signup metadata.

commit;
