begin;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  profile_email text;
begin
  requested_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  if new.is_anonymous then
    requested_name := coalesce(nullif(requested_name, ''), 'Guest Learner');
    profile_email := 'guest-' || new.id::text || '@anonymous.skillspring.local';
  else
    if char_length(requested_name) < 1 or char_length(requested_name) > 120 then
      raise exception 'A valid full name is required';
    end if;
    profile_email := lower(new.email);
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (new.id, requested_name, profile_email, 'student'::public.user_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.open_learning_access()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner_id uuid := auth.uid();
begin
  if learner_id is null or not exists (
    select 1 from public.profiles p
    where p.id = learner_id and p.role = 'student'::public.user_role
  ) then
    raise exception 'LEARNER_ACCESS_REQUIRED';
  end if;

  insert into public.enrollments (student_id, course_id, status)
  select learner_id, c.id, 'active'::public.enrollment_status
  from public.courses c
  where c.status = 'published'::public.course_status
  on conflict (student_id, course_id) do nothing;
end;
$$;

create or replace function public.claim_certificate(
  p_certificate_id uuid,
  p_full_name text,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner_id uuid := auth.uid();
  learner_name text := btrim(p_full_name);
  learner_email text := nullif(lower(btrim(p_email)), '');
begin
  if learner_id is null or char_length(learner_name) < 2 or char_length(learner_name) > 120 then
    raise exception 'CERTIFICATE_DETAILS_INVALID';
  end if;
  if learner_email is not null and learner_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'CERTIFICATE_EMAIL_INVALID';
  end if;
  if not exists (
    select 1 from public.certificates c
    where c.id = p_certificate_id and c.student_id = learner_id
      and c.status = 'active'::public.certificate_status
  ) then
    raise exception 'CERTIFICATE_NOT_FOUND';
  end if;

  update public.profiles
  set full_name = learner_name,
      email = coalesce(learner_email, email),
      updated_at = now()
  where id = learner_id and role = 'student'::public.user_role;

  update public.certificates
  set student_name = learner_name
  where id = p_certificate_id and student_id = learner_id;

  return p_certificate_id;
end;
$$;

revoke all on function public.open_learning_access() from public, anon;
revoke all on function public.claim_certificate(uuid, text, text) from public, anon;
grant execute on function public.open_learning_access() to authenticated;
grant execute on function public.claim_certificate(uuid, text, text) to authenticated;

commit;
