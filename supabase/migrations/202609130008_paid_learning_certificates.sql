begin;

alter table public.courses
  add column currency char(3) not null default 'PKR'
    check (currency = upper(currency));

create table public.payment_settings (
  id boolean primary key default true check (id),
  payment_method text not null check (char_length(trim(payment_method)) between 2 and 80),
  account_title text not null check (char_length(trim(account_title)) between 2 and 120),
  account_number text not null check (char_length(trim(account_number)) between 4 and 120),
  instructions text,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger payment_settings_set_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();

alter table public.payments
  add column proof_path text,
  add column student_note text check (student_note is null or char_length(student_note) <= 1000),
  add column admin_message text check (admin_message is null or char_length(admin_message) <= 2000),
  add column reviewer_id uuid references public.profiles(id) on delete set null,
  add column reviewed_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add column submission_token uuid not null default extensions.gen_random_uuid(),
  add constraint payments_submission_token_unique unique (submission_token);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create unique index payments_one_pending_per_course_idx
on public.payments(student_id, course_id)
where status = 'pending'::public.payment_status;

create index payments_status_created_idx
on public.payments(status, created_at desc);

create or replace function public.validate_manual_payment_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.provider = 'manual' and new.proof_path is null then
    raise exception 'PAYMENT_PROOF_REQUIRED';
  end if;

  if new.status = 'pending'::public.payment_status then
    if new.paid_at is not null or new.reviewer_id is not null or new.reviewed_at is not null then
      raise exception 'PENDING_PAYMENT_REVIEW_INVALID';
    end if;
  elsif new.status = 'paid'::public.payment_status then
    if new.paid_at is null or new.reviewer_id is null or new.reviewed_at is null then
      raise exception 'PAID_PAYMENT_REVIEW_REQUIRED';
    end if;
  elsif new.status = 'failed'::public.payment_status then
    if new.paid_at is not null or new.reviewer_id is null or new.reviewed_at is null
      or char_length(trim(coalesce(new.admin_message, ''))) = 0 then
      raise exception 'REJECTED_PAYMENT_REASON_REQUIRED';
    end if;
  end if;

  return new;
end;
$$;

create trigger payments_validate_review
before insert or update on public.payments
for each row execute function public.validate_manual_payment_review();

alter table public.payment_settings enable row level security;

create policy "Students can read active payment instructions"
on public.payment_settings for select to authenticated
using (
  is_active
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'student'::public.user_role
  )
);

create policy "Admins can manage payment instructions"
on public.payment_settings for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can read payments"
on public.payments for select to authenticated
using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Students can upload their payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'student'::public.user_role
  )
);

create policy "Students can read their payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

create policy "Students can remove their payment proofs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = (select auth.uid())::text
);

create policy "Admins can read payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (select public.is_admin())
);

create or replace function public.submit_course_payment(
  p_course_id uuid,
  p_proof_path text,
  p_student_note text,
  p_submission_token uuid
)
returns table (payment_id uuid, payment_status public.payment_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_amount numeric(12, 2);
  v_currency char(3);
  v_payment_id uuid;
begin
  if v_student_id is null or p_course_id is null or p_submission_token is null then
    raise exception 'PAYMENT_ACCESS_DENIED';
  end if;
  if char_length(coalesce(p_student_note, '')) > 1000 then
    raise exception 'PAYMENT_NOTE_INVALID';
  end if;
  if p_proof_path is null or split_part(p_proof_path, '/', 1) <> v_student_id::text then
    raise exception 'PAYMENT_PROOF_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_student_id::text || p_course_id::text, 0));

  select c.price, c.currency into v_amount, v_currency
  from public.courses c
  join public.profiles p on p.id = v_student_id
  where c.id = p_course_id
    and c.status = 'published'::public.course_status
    and c.price > 0
    and p.role = 'student'::public.user_role;

  if v_amount is null then raise exception 'PAYMENT_COURSE_UNAVAILABLE'; end if;
  if not exists (select 1 from public.payment_settings s where s.id and s.is_active) then
    raise exception 'PAYMENT_INSTRUCTIONS_UNAVAILABLE';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'payment-proofs' and o.name = p_proof_path
  ) then
    raise exception 'PAYMENT_PROOF_NOT_FOUND';
  end if;
  if exists (
    select 1 from public.enrollments e
    where e.student_id = v_student_id and e.course_id = p_course_id
      and e.status in ('active', 'completed')
  ) then
    raise exception 'COURSE_ALREADY_AVAILABLE';
  end if;

  select p.id into v_payment_id
  from public.payments p
  where p.submission_token = p_submission_token
    and p.student_id = v_student_id;

  if v_payment_id is not null then
    return query select p.id, p.status from public.payments p where p.id = v_payment_id;
    return;
  end if;

  if exists (
    select 1 from public.payments p
    where p.student_id = v_student_id and p.course_id = p_course_id
      and p.status = 'pending'::public.payment_status
  ) then
    raise exception 'PAYMENT_ALREADY_PENDING';
  end if;

  insert into public.payments (
    student_id, course_id, amount, currency, status, provider,
    proof_path, student_note, submission_token
  ) values (
    v_student_id, p_course_id, v_amount, v_currency, 'pending', 'manual',
    p_proof_path, nullif(trim(coalesce(p_student_note, '')), ''), p_submission_token
  ) returning id into v_payment_id;

  return query select p.id, p.status from public.payments p where p.id = v_payment_id;
end;
$$;

create or replace function public.review_course_payment(
  p_payment_id uuid,
  p_decision text,
  p_admin_message text
)
returns table (payment_id uuid, payment_status public.payment_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_payment public.payments%rowtype;
begin
  if v_admin_id is null or not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_decision not in ('approve', 'reject') then raise exception 'PAYMENT_DECISION_INVALID'; end if;
  if p_decision = 'reject' and char_length(trim(coalesce(p_admin_message, ''))) = 0 then
    raise exception 'PAYMENT_REJECTION_REASON_REQUIRED';
  end if;
  if char_length(coalesce(p_admin_message, '')) > 2000 then raise exception 'PAYMENT_MESSAGE_INVALID'; end if;

  select p.* into v_payment
  from public.payments p
  where p.id = p_payment_id
  for update;

  if v_payment.id is null or v_payment.status <> 'pending'::public.payment_status then
    raise exception 'PAYMENT_NOT_PENDING';
  end if;

  if p_decision = 'approve' then
    update public.payments
    set status = 'paid', paid_at = now(), reviewer_id = v_admin_id,
        reviewed_at = now(), admin_message = nullif(trim(coalesce(p_admin_message, '')), '')
    where id = p_payment_id;

    insert into public.enrollments (student_id, course_id, status, progress_percentage)
    values (v_payment.student_id, v_payment.course_id, 'active', 0)
    on conflict (student_id, course_id) do update set
      status = case when public.enrollments.status = 'completed' then public.enrollments.status else 'active'::public.enrollment_status end;

    insert into public.notifications (student_id, title, message, type)
    values (v_payment.student_id, 'Payment approved', 'Your course payment was approved. Course lessons and quizzes are now available.', 'payment');
  else
    update public.payments
    set status = 'failed', paid_at = null, reviewer_id = v_admin_id,
        reviewed_at = now(), admin_message = trim(p_admin_message)
    where id = p_payment_id;

    insert into public.notifications (student_id, title, message, type)
    values (v_payment.student_id, 'Payment needs attention', trim(p_admin_message), 'payment');
  end if;

  return query select p.id, p.status from public.payments p where p.id = p_payment_id;
end;
$$;

revoke all on function public.submit_course_payment(uuid, text, text, uuid) from public, anon;
revoke all on function public.review_course_payment(uuid, text, text) from public, anon;
grant execute on function public.submit_course_payment(uuid, text, text, uuid) to authenticated;
grant execute on function public.review_course_payment(uuid, text, text) to authenticated;

alter table public.certificates
  drop constraint if exists certificates_student_id_course_id_certificate_type_key,
  add column quiz_id uuid references public.quizzes(id) on delete restrict,
  add column student_name text,
  add column quiz_title text,
  add column score numeric(8, 2),
  add column max_score numeric(8, 2),
  add column percentage numeric(5, 2);

create unique index certificates_student_quiz_unique
on public.certificates(student_id, quiz_id)
where quiz_id is not null;

create policy "Admins can read certificates"
on public.certificates for select to authenticated
using ((select public.is_admin()));

create or replace function public.issue_quiz_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;
  v_quiz_title text;
  v_student_name text;
begin
  if not new.passed then return new; end if;

  select m.course_id, q.title, p.full_name
  into v_course_id, v_quiz_title, v_student_name
  from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.course_modules m on m.id = l.module_id
  join public.profiles p on p.id = new.student_id
  join public.enrollments e on e.course_id = m.course_id and e.student_id = new.student_id
  where q.id = new.quiz_id
    and e.status in ('active', 'completed');

  if v_course_id is null then return new; end if;

  insert into public.certificates (
    student_id, course_id, quiz_id, certificate_number, certificate_type,
    verification_token, status, student_name, quiz_title, score, max_score, percentage
  ) values (
    new.student_id, v_course_id, new.quiz_id,
    'SS-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 16)),
    'quiz', extensions.gen_random_uuid()::text, 'active',
    v_student_name, v_quiz_title, new.score, new.max_score, new.percentage
  ) on conflict (student_id, quiz_id) where quiz_id is not null do nothing;

  return new;
end;
$$;

create trigger quiz_attempt_issue_certificate
after insert on public.quiz_attempts
for each row execute function public.issue_quiz_certificate();

create or replace function public.verify_certificate(p_token text)
returns table (
  certificate_number text,
  student_name text,
  course_title text,
  quiz_title text,
  score numeric,
  max_score numeric,
  percentage numeric,
  issued_at timestamptz,
  certificate_status public.certificate_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.certificate_number, c.student_name, cr.title, c.quiz_title,
         c.score, c.max_score, c.percentage, c.issued_at, c.status
  from public.certificates c
  join public.courses cr on cr.id = c.course_id
  where c.verification_token = p_token
    and c.status = 'active'::public.certificate_status;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

drop policy "Enrolled students can read published quizzes" on public.quizzes;

create policy "Students can discover published quizzes"
on public.quizzes for select to authenticated
using (
  is_published
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.profiles p on p.id = (select auth.uid())
    where l.id = quizzes.lesson_id
      and c.status = 'published'::public.course_status
      and p.role = 'student'::public.user_role
  )
);

commit;
