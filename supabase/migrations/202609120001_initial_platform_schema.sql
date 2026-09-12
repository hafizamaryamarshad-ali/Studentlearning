begin;

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('student', 'admin');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.enrollment_status as enum ('pending', 'active', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.submission_status as enum ('submitted', 'under_review', 'approved', 'rejected');
create type public.referral_status as enum ('pending', 'qualified', 'rejected');
create type public.withdrawal_status as enum ('pending', 'approved', 'rejected', 'paid');
create type public.challenge_status as enum ('draft', 'upcoming', 'active', 'completed', 'archived');
create type public.reward_status as enum ('active', 'inactive', 'archived');
create type public.wallet_transaction_type as enum (
  'points_reward', 'referral_reward', 'challenge_reward', 'withdrawal', 'adjustment'
);
create type public.wallet_transaction_status as enum ('pending', 'completed', 'failed', 'reversed');
create type public.certificate_status as enum ('active', 'revoked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  email text not null unique check (email = lower(email)),
  avatar_url text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null,
  short_description text not null check (char_length(short_description) <= 300),
  thumbnail_url text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  status public.course_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_modules (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, sort_order)
);

create table public.lessons (
  id uuid primary key default extensions.gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  content text,
  video_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, sort_order)
);

create table public.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  status public.enrollment_status not null default 'pending',
  progress_percentage numeric(5, 2) not null default 0
    check (progress_percentage between 0 and 100),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (student_id, course_id),
  check (completed_at is null or completed_at >= enrolled_at)
);

create table public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'USD' check (currency = upper(currency)),
  status public.payment_status not null default 'pending',
  provider text,
  provider_reference text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (paid_at is null or paid_at >= created_at)
);

create table public.quizzes (
  id uuid primary key default extensions.gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  passing_score numeric(5, 2) not null default 70 check (passing_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default extensions.gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null check (char_length(trim(question)) > 0),
  options jsonb not null check (jsonb_typeof(options) in ('array', 'object')),
  correct_answer jsonb not null,
  points integer not null default 1 check (points > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (quiz_id, sort_order)
);

create table public.quiz_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score numeric(8, 2) not null check (score >= 0),
  passed boolean not null default false,
  attempted_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null,
  submission_type text not null check (submission_type in ('text', 'url', 'file', 'mixed')),
  points integer not null default 0 check (points >= 0),
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.task_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  file_url text,
  status public.submission_status not null default 'submitted',
  awarded_points integer not null default 0 check (awarded_points >= 0),
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (task_id, student_id),
  check (num_nonnulls(submission_text, submission_url, file_url) >= 1),
  check (reviewed_at is null or reviewed_at >= submitted_at)
);

create table public.points (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points <> 0),
  source text not null check (char_length(trim(source)) > 0),
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null,
  course_id uuid references public.courses(id) on delete set null,
  points integer not null default 0 check (points >= 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.challenge_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.challenge_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(10, 2) not null default 0 check (score >= 0),
  rank integer check (rank is null or rank > 0),
  joined_at timestamptz not null default now(),
  unique (challenge_id, student_id)
);

create table public.rewards (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null,
  reward_type text not null check (char_length(trim(reward_type)) > 0),
  reward_value numeric(12, 2) not null default 0 check (reward_value >= 0),
  points_required integer not null default 0 check (points_required >= 0),
  status public.reward_status not null default 'inactive',
  created_at timestamptz not null default now()
);

create table public.referrals (
  id uuid primary key default extensions.gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete restrict,
  referred_student_id uuid not null unique references public.profiles(id) on delete restrict,
  referral_code text not null check (char_length(trim(referral_code)) between 4 and 64),
  status public.referral_status not null default 'pending',
  reward_amount numeric(12, 2) not null default 0 check (reward_amount >= 0),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  check (referrer_id <> referred_student_id),
  check (
    (status = 'qualified' and qualified_at is not null)
    or (status <> 'qualified' and qualified_at is null)
  )
);

create table public.wallets (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  available_balance numeric(12, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(12, 2) not null default 0 check (pending_balance >= 0),
  total_earned numeric(12, 2) not null default 0 check (total_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type public.wallet_transaction_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  status public.wallet_transaction_status not null default 'pending',
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create table public.withdrawal_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (char_length(trim(method)) > 0),
  account_reference text not null check (char_length(trim(account_reference)) > 0),
  status public.withdrawal_status not null default 'pending',
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  check (
    (status = 'pending' and processed_at is null)
    or (status <> 'pending' and processed_at is not null)
  )
);

create table public.certificates (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  certificate_number text not null unique,
  certificate_type text not null check (char_length(trim(certificate_type)) > 0),
  issued_at timestamptz not null default now(),
  verification_token text not null unique,
  status public.certificate_status not null default 'active',
  unique (student_id, course_id, certificate_type)
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  message text not null,
  type text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index courses_status_idx on public.courses(status);
create index course_modules_course_id_idx on public.course_modules(course_id);
create index lessons_module_id_idx on public.lessons(module_id);
create index enrollments_student_status_idx on public.enrollments(student_id, status);
create index enrollments_course_id_idx on public.enrollments(course_id);
create index payments_student_created_idx on public.payments(student_id, created_at desc);
create index payments_course_id_idx on public.payments(course_id);
create index payments_status_idx on public.payments(status);
create index quizzes_lesson_id_idx on public.quizzes(lesson_id);
create index quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);
create index quiz_attempts_student_quiz_idx on public.quiz_attempts(student_id, quiz_id);
create index quiz_attempts_attempted_at_idx on public.quiz_attempts(attempted_at desc);
create index tasks_course_id_idx on public.tasks(course_id);
create index task_submissions_student_status_idx on public.task_submissions(student_id, status);
create index task_submissions_task_id_idx on public.task_submissions(task_id);
create index points_student_created_idx on public.points(student_id, created_at desc);
create index points_reference_id_idx on public.points(reference_id) where reference_id is not null;
create index challenges_course_id_idx on public.challenges(course_id);
create index challenges_status_dates_idx on public.challenges(status, start_at, end_at);
create index challenge_participants_student_id_idx on public.challenge_participants(student_id);
create index challenge_participants_rank_idx on public.challenge_participants(challenge_id, rank);
create index rewards_status_idx on public.rewards(status);
create index referrals_referrer_status_idx on public.referrals(referrer_id, status);
create unique index referrals_referral_code_lower_idx on public.referrals(lower(referral_code));
create index wallet_transactions_wallet_created_idx on public.wallet_transactions(wallet_id, created_at desc);
create index wallet_transactions_reference_idx on public.wallet_transactions(reference_type, reference_id)
  where reference_id is not null;
create index withdrawal_requests_student_status_idx on public.withdrawal_requests(student_id, status);
create index withdrawal_requests_status_requested_idx on public.withdrawal_requests(status, requested_at);
create index certificates_student_id_idx on public.certificates(student_id);
create index certificates_course_id_idx on public.certificates(course_id);
create index notifications_student_created_idx on public.notifications(student_id, created_at desc);
create index notifications_unread_idx on public.notifications(student_id, created_at desc) where read_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
for each row execute function public.set_updated_at();
create trigger wallets_set_updated_at before update on public.wallets
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.points enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.rewards enable row level security;
alter table public.referrals enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.certificates enable row level security;
alter table public.notifications enable row level security;

create policy "Published courses are readable"
on public.courses for select to anon, authenticated
using (status = 'published');

create policy "Students can read their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Enrolled students can read course modules"
on public.course_modules for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.course_id = course_modules.course_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

create policy "Enrolled students can read lessons"
on public.lessons for select to authenticated
using (
  exists (
    select 1
    from public.course_modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = lessons.module_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

create policy "Students can read their enrollments"
on public.enrollments for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can read their payments"
on public.payments for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Enrolled students can read quizzes"
on public.quizzes for select to authenticated
using (
  exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = quizzes.lesson_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

-- quiz_questions intentionally has no client SELECT policy because it contains correct_answer.
-- Questions must later be delivered through a trusted server/RPC that omits answer material.

create policy "Students can read their quiz attempts"
on public.quiz_attempts for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Enrolled students can read tasks"
on public.tasks for select to authenticated
using (
  exists (
    select 1 from public.enrollments e
    where e.course_id = tasks.course_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

create policy "Students can read their task submissions"
on public.task_submissions for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can read their points"
on public.points for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Active challenges are readable"
on public.challenges for select to authenticated
using (status in ('upcoming', 'active', 'completed'));

create policy "Students can read their challenge participation"
on public.challenge_participants for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Active rewards are readable"
on public.rewards for select to authenticated
using (status = 'active');

create policy "Students can read their referrals"
on public.referrals for select to authenticated
using ((select auth.uid()) = referrer_id or (select auth.uid()) = referred_student_id);

create policy "Students can read their wallet"
on public.wallets for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can read their wallet transactions"
on public.wallet_transactions for select to authenticated
using (
  exists (
    select 1 from public.wallets w
    where w.id = wallet_transactions.wallet_id
      and w.student_id = (select auth.uid())
  )
);

create policy "Students can read their withdrawal requests"
on public.withdrawal_requests for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can read their certificates"
on public.certificates for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can read their notifications"
on public.notifications for select to authenticated
using ((select auth.uid()) = student_id);

-- No direct client INSERT, UPDATE, or DELETE policies are created for financial,
-- award, referral, payment, certificate, or review data. Future trusted server
-- workflows must enforce eligibility and use server-only credentials.

commit;
