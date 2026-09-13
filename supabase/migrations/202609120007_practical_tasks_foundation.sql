begin;

alter table public.tasks
  add column module_id uuid references public.course_modules(id) on delete set null,
  add column lesson_id uuid references public.lessons(id) on delete set null,
  add column is_published boolean not null default false,
  add column resubmission_allowed boolean not null default true,
  add column updated_at timestamptz not null default now(),
  add constraint tasks_lesson_requires_module check (lesson_id is null or module_id is not null);

create index tasks_module_id_idx on public.tasks(module_id) where module_id is not null;
create index tasks_lesson_id_idx on public.tasks(lesson_id) where lesson_id is not null;
create index tasks_published_course_idx on public.tasks(course_id, is_published);

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.validate_task_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.module_id is not null and not exists (
    select 1 from public.course_modules m
    where m.id = new.module_id and m.course_id = new.course_id
  ) then
    raise exception 'TASK_MODULE_MISMATCH';
  end if;
  if new.lesson_id is not null and not exists (
    select 1 from public.lessons l
    where l.id = new.lesson_id and l.module_id = new.module_id
  ) then
    raise exception 'TASK_LESSON_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger tasks_validate_scope before insert or update of course_id, module_id, lesson_id
on public.tasks for each row execute function public.validate_task_scope();

alter table public.task_submissions
  add column reviewer_id uuid references public.profiles(id) on delete set null,
  add column submission_token uuid not null default extensions.gen_random_uuid(),
  add column updated_at timestamptz not null default now();

create unique index task_submissions_token_unique
on public.task_submissions(student_id, task_id, submission_token);

create trigger task_submissions_set_updated_at before update on public.task_submissions
for each row execute function public.set_updated_at();

create or replace function public.validate_task_submission_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_max_points integer;
begin
  select t.points into v_max_points from public.tasks t where t.id = new.task_id;
  if v_max_points is null or new.awarded_points < 0 or new.awarded_points > v_max_points then
    raise exception 'TASK_SCORE_INVALID';
  end if;
  if new.status <> 'submitted'::public.submission_status
    and (new.reviewer_id is null or new.reviewed_at is null) then
    raise exception 'TASK_REVIEWER_REQUIRED';
  end if;
  return new;
end;
$$;

create trigger task_submissions_validate_review before insert or update
on public.task_submissions for each row execute function public.validate_task_submission_review();

create unique index points_task_submission_unique
on public.points(source, reference_id)
where source = 'task_submission' and reference_id is not null;

drop policy "Enrolled students can read tasks" on public.tasks;

create policy "Enrolled students can read published tasks"
on public.tasks for select to authenticated
using (
  is_published
  and exists (
    select 1
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    join public.profiles p on p.id = e.student_id
    where c.id = tasks.course_id
      and c.status = 'published'::public.course_status
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
      and p.role = 'student'::public.user_role
  )
);

create policy "Admins can manage tasks"
on public.tasks for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can read task submissions"
on public.task_submissions for select to authenticated
using ((select public.is_admin()));

create policy "Admins can update task submissions"
on public.task_submissions for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.submit_task_work(
  p_task_id uuid,
  p_submission_text text,
  p_submission_url text,
  p_submission_token uuid
)
returns table (submission_id uuid, submission_status public.submission_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_existing public.task_submissions%rowtype;
  v_text text := nullif(btrim(p_submission_text), '');
  v_url text := nullif(btrim(p_submission_url), '');
  v_submission_id uuid;
begin
  if v_student_id is null or p_task_id is null or p_submission_token is null then
    raise exception 'TASK_ACCESS_DENIED';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_student_id and p.role = 'student'::public.user_role
  ) then
    raise exception 'TASK_ACCESS_DENIED';
  end if;

  select t.* into v_task
  from public.tasks t
  join public.courses c on c.id = t.course_id
  join public.enrollments e on e.course_id = t.course_id
  where t.id = p_task_id
    and t.is_published
    and c.status = 'published'::public.course_status
    and e.student_id = v_student_id
    and e.status in ('active', 'completed');

  if not found then raise exception 'TASK_ACCESS_DENIED'; end if;
  if v_task.deadline is not null and now() > v_task.deadline then raise exception 'TASK_DEADLINE_PASSED'; end if;
  if v_task.submission_type in ('file', 'mixed') then raise exception 'TASK_FILE_UNSUPPORTED'; end if;
  if v_text is not null and char_length(v_text) > 20000 then raise exception 'TASK_TEXT_TOO_LONG'; end if;
  if v_url is not null and (char_length(v_url) > 2048 or v_url !~* '^https?://[^[:space:]]+$') then raise exception 'TASK_URL_INVALID'; end if;
  if (v_task.submission_type = 'text' and v_text is null)
    or (v_task.submission_type = 'url' and v_url is null) then
    raise exception 'TASK_SUBMISSION_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_student_id::text || ':' || p_task_id::text, 0));
  select s.* into v_existing
  from public.task_submissions s
  where s.task_id = p_task_id and s.student_id = v_student_id
  for update;

  if found and v_existing.submission_token = p_submission_token then
    return query select v_existing.id, v_existing.status;
    return;
  end if;
  if found and (
    not v_task.resubmission_allowed
    or v_existing.status in ('under_review', 'approved')
  ) then
    raise exception 'TASK_RESUBMISSION_NOT_ALLOWED';
  end if;

  if found then
    update public.task_submissions
    set submission_text = case when v_task.submission_type = 'text' then v_text else null end,
        submission_url = case when v_task.submission_type = 'url' then v_url else null end,
        file_url = null,
        status = 'submitted',
        awarded_points = 0,
        feedback = null,
        reviewer_id = null,
        reviewed_at = null,
        submitted_at = now(),
        submission_token = p_submission_token
    where id = v_existing.id
    returning id into v_submission_id;
  else
    insert into public.task_submissions (
      task_id, student_id, submission_text, submission_url, submission_token
    ) values (
      p_task_id, v_student_id,
      case when v_task.submission_type = 'text' then v_text else null end,
      case when v_task.submission_type = 'url' then v_url else null end,
      p_submission_token
    ) returning id into v_submission_id;
  end if;

  return query select v_submission_id, 'submitted'::public.submission_status;
end;
$$;

create or replace function public.review_task_submission(
  p_submission_id uuid,
  p_status public.submission_status,
  p_awarded_points integer,
  p_feedback text
)
returns table (submission_id uuid, submission_status public.submission_status, awarded_points integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_submission public.task_submissions%rowtype;
  v_max_points integer;
  v_feedback text := nullif(btrim(p_feedback), '');
begin
  if v_admin_id is null or not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_submission_id is null or p_status not in ('under_review', 'needs_revision', 'approved', 'rejected') then
    raise exception 'TASK_REVIEW_INVALID';
  end if;
  if p_awarded_points is null or p_awarded_points < 0 then raise exception 'TASK_SCORE_INVALID'; end if;
  if v_feedback is not null and char_length(v_feedback) > 10000 then raise exception 'TASK_FEEDBACK_TOO_LONG'; end if;

  select s.* into v_submission
  from public.task_submissions s
  where s.id = p_submission_id
  for update;

  if not found then raise exception 'TASK_SCORE_INVALID'; end if;
  select t.points into v_max_points from public.tasks t where t.id = v_submission.task_id;
  if v_max_points is null or p_awarded_points > v_max_points then raise exception 'TASK_SCORE_INVALID'; end if;
  if p_status in ('needs_revision', 'rejected') and v_feedback is null then raise exception 'TASK_FEEDBACK_REQUIRED'; end if;

  update public.task_submissions
  set status = p_status,
      awarded_points = p_awarded_points,
      feedback = v_feedback,
      reviewer_id = v_admin_id,
      reviewed_at = now()
  where id = p_submission_id;

  if p_status = 'approved' and p_awarded_points > 0 then
    insert into public.points(student_id, points, source, reference_id)
    values (v_submission.student_id, p_awarded_points, 'task_submission', p_submission_id)
    on conflict (source, reference_id) where source = 'task_submission' and reference_id is not null
    do update set student_id = excluded.student_id, points = excluded.points;
  else
    delete from public.points p
    where p.source = 'task_submission' and p.reference_id = p_submission_id;
  end if;

  return query select p_submission_id, p_status, p_awarded_points;
end;
$$;

revoke all on function public.submit_task_work(uuid, text, text, uuid) from public, anon;
revoke all on function public.review_task_submission(uuid, public.submission_status, integer, text) from public, anon;
grant execute on function public.submit_task_work(uuid, text, text, uuid) to authenticated;
grant execute on function public.review_task_submission(uuid, public.submission_status, integer, text) to authenticated;

commit;
