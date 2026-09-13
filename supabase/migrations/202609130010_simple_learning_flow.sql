begin;

insert into public.payment_settings (
  id, payment_method, account_title, account_number, instructions, is_active
)
values (
  true,
  'Easypaisa (Demo)',
  'SkillSpring Demo Account',
  '0300-0000000',
  'Demo payment flow only — do not send real money. Note this number, complete a demo payment, then upload a JPG, PNG, or WebP screenshot for admin review.',
  true
)
on conflict (id) do nothing;

create policy "Admins can update student course access"
on public.enrollments for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.tasks (
  id, course_id, title, description, submission_type, points,
  deadline, module_id, lesson_id, is_published, resubmission_allowed
)
values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Create a one-page campaign plan', 'Write a short campaign plan that names one audience, one goal, one channel, and one metric you would track.', 'text', 100, null, '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', true, true),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Explain a social post design', 'Describe the visual hierarchy, colors, typography, spacing, and export format you would use for one social media post.', 'text', 100, null, '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', true, true),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Write your freelance service offer', 'Write a focused offer containing the client, problem, deliverable, timeframe, boundaries, and price basis.', 'text', 100, null, '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', true, true),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Plan a responsive web page', 'Describe the page sections, semantic HTML elements, mobile layout, and accessibility checks for a simple service page.', 'text', 100, null, '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', true, true),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'Design an office workflow', 'Explain how you would organize files and use a document, spreadsheet, and presentation for one small project.', 'text', 100, null, '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', true, true),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 'Prepare a workplace introduction', 'Write a clear workplace introduction and a short follow-up question that demonstrates active listening.', 'text', 100, null, '20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', true, true),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', 'Validate an online store idea', 'Describe the customer need, product, estimated costs, fulfillment plan, and one low-risk way to test demand.', 'text', 100, null, '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', true, true),
  ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008', 'Explain a small data analysis', 'Describe how you would clean a small dataset, calculate a useful summary, choose a chart, and report limitations.', 'text', 100, null, '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000008', true, true)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  submission_type = excluded.submission_type,
  points = excluded.points,
  deadline = excluded.deadline,
  module_id = excluded.module_id,
  lesson_id = excluded.lesson_id,
  is_published = excluded.is_published,
  resubmission_allowed = excluded.resubmission_allowed;

alter table public.certificates
  add column task_id uuid references public.tasks(id) on delete restrict,
  add column achievement_title text;

update public.certificates
set achievement_title = coalesce(quiz_title, 'Course completion')
where achievement_title is null;

create unique index certificates_student_course_completion_unique
on public.certificates(student_id, course_id)
where certificate_type = 'course' and quiz_id is null and task_id is null;

create unique index certificates_student_task_unique
on public.certificates(student_id, task_id)
where task_id is not null;

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
    verification_token, status, student_name, quiz_title, achievement_title,
    score, max_score, percentage
  ) values (
    new.student_id, v_course_id, new.quiz_id,
    'SS-Q-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 14)),
    'quiz', extensions.gen_random_uuid()::text, 'active',
    v_student_name, v_quiz_title, v_quiz_title,
    new.score, new.max_score, new.percentage
  ) on conflict do nothing;

  return new;
end;
$$;

create or replace function public.issue_course_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_name text;
  v_course_title text;
begin
  if new.status <> 'completed'::public.enrollment_status then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'completed'::public.enrollment_status then return new; end if;

  select p.full_name, c.title into v_student_name, v_course_title
  from public.profiles p, public.courses c
  where p.id = new.student_id and c.id = new.course_id;

  insert into public.certificates (
    student_id, course_id, certificate_number, certificate_type,
    verification_token, status, student_name, achievement_title,
    score, max_score, percentage
  ) values (
    new.student_id, new.course_id,
    'SS-C-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 14)),
    'course', extensions.gen_random_uuid()::text, 'active',
    v_student_name, v_course_title, 100, 100, 100
  ) on conflict do nothing;

  return new;
end;
$$;

create trigger enrollment_issue_course_certificate
after insert or update of status on public.enrollments
for each row execute function public.issue_course_certificate();

create or replace function public.issue_task_certificate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;
  v_task_title text;
  v_max_score integer;
  v_student_name text;
  v_percentage numeric(5, 2);
begin
  if new.status <> 'approved'::public.submission_status then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'approved'::public.submission_status then return new; end if;

  select t.course_id, t.title, t.points, p.full_name
  into v_course_id, v_task_title, v_max_score, v_student_name
  from public.tasks t
  join public.profiles p on p.id = new.student_id
  where t.id = new.task_id;

  if v_course_id is null then return new; end if;
  v_percentage := case when v_max_score > 0 then round((new.awarded_points::numeric * 100) / v_max_score, 2) else 100 end;

  insert into public.certificates (
    student_id, course_id, task_id, certificate_number, certificate_type,
    verification_token, status, student_name, achievement_title,
    score, max_score, percentage
  ) values (
    new.student_id, v_course_id, new.task_id,
    'SS-T-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 14)),
    'task', extensions.gen_random_uuid()::text, 'active',
    v_student_name, v_task_title, new.awarded_points, v_max_score, v_percentage
  ) on conflict do nothing;

  return new;
end;
$$;

create trigger task_submission_issue_certificate
after insert or update of status on public.task_submissions
for each row execute function public.issue_task_certificate();

insert into public.certificates (
  student_id, course_id, certificate_number, certificate_type,
  verification_token, status, student_name, achievement_title,
  score, max_score, percentage
)
select e.student_id, e.course_id,
  'SS-C-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 14)),
  'course', extensions.gen_random_uuid()::text, 'active', p.full_name, c.title,
  100, 100, 100
from public.enrollments e
join public.profiles p on p.id = e.student_id
join public.courses c on c.id = e.course_id
where e.status = 'completed'
on conflict do nothing;

insert into public.certificates (
  student_id, course_id, task_id, certificate_number, certificate_type,
  verification_token, status, student_name, achievement_title,
  score, max_score, percentage
)
select s.student_id, t.course_id, s.task_id,
  'SS-T-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 14)),
  'task', extensions.gen_random_uuid()::text, 'active', p.full_name, t.title,
  s.awarded_points, t.points,
  case when t.points > 0 then round((s.awarded_points::numeric * 100) / t.points, 2) else 100 end
from public.task_submissions s
join public.tasks t on t.id = s.task_id
join public.profiles p on p.id = s.student_id
where s.status = 'approved'
on conflict do nothing;

drop function public.verify_certificate(text);

create function public.verify_certificate(p_token text)
returns table (
  certificate_number text,
  student_name text,
  course_title text,
  achievement_type text,
  achievement_title text,
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
  select c.certificate_number, c.student_name, cr.title, c.certificate_type,
         c.achievement_title, c.score, c.max_score, c.percentage,
         c.issued_at, c.status
  from public.certificates c
  join public.courses cr on cr.id = c.course_id
  where c.verification_token = p_token
    and c.status = 'active'::public.certificate_status;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

commit;
