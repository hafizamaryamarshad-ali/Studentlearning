begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'::public.user_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.lesson_progress (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id),
  check (
    (completed and completed_at is not null)
    or (not completed and completed_at is null)
  )
);

create index lesson_progress_student_id_idx on public.lesson_progress(student_id);
create index lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index lesson_progress_student_completed_idx
  on public.lesson_progress(student_id, completed) where completed;

create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

create or replace function public.sync_course_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_student uuid;
  target_course uuid;
  total_lessons integer;
  completed_lessons integer;
  calculated_progress numeric(5, 2);
begin
  target_student := coalesce(new.student_id, old.student_id);

  select m.course_id into target_course
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  where l.id = coalesce(new.lesson_id, old.lesson_id);

  select count(*) into total_lessons
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  where m.course_id = target_course;

  select count(*) into completed_lessons
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.course_modules m on m.id = l.module_id
  where lp.student_id = target_student
    and lp.completed
    and m.course_id = target_course;

  calculated_progress := case
    when total_lessons = 0 then 0
    else round((completed_lessons::numeric * 100) / total_lessons, 2)
  end;

  update public.enrollments
  set
    progress_percentage = calculated_progress,
    status = case
      when calculated_progress = 100 then 'completed'::public.enrollment_status
      when status = 'completed' then 'active'::public.enrollment_status
      else status
    end,
    completed_at = case
      when calculated_progress = 100 then coalesce(completed_at, now())
      else null
    end
  where student_id = target_student and course_id = target_course;

  return coalesce(new, old);
end;
$$;

create trigger lesson_progress_sync_course
after insert or update or delete on public.lesson_progress
for each row execute function public.sync_course_progress();

create or replace view public.course_outline
with (security_barrier = true)
as
select
  c.id as course_id,
  c.slug as course_slug,
  m.id as module_id,
  m.title as module_title,
  m.description as module_description,
  m.sort_order as module_sort_order,
  l.id as lesson_id,
  l.title as lesson_title,
  l.description as lesson_description,
  l.sort_order as lesson_sort_order
from public.courses c
join public.course_modules m on m.course_id = c.id
left join public.lessons l on l.module_id = m.id
where c.status = 'published'::public.course_status;

grant select on public.course_outline to anon, authenticated;

alter table public.lesson_progress enable row level security;

create policy "Students can read their lesson progress"
on public.lesson_progress for select to authenticated
using ((select auth.uid()) = student_id);

create policy "Students can create their lesson progress"
on public.lesson_progress for insert to authenticated
with check (
  (select auth.uid()) = student_id
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = lesson_progress.lesson_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

create policy "Students can update their lesson progress"
on public.lesson_progress for update to authenticated
using ((select auth.uid()) = student_id)
with check ((select auth.uid()) = student_id);

create policy "Students can enroll in free published courses"
on public.enrollments for insert to authenticated
with check (
  student_id = (select auth.uid())
  and status = 'active'::public.enrollment_status
  and progress_percentage = 0
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'student'::public.user_role
  )
  and exists (
    select 1 from public.courses c
    where c.id = enrollments.course_id
      and c.status = 'published'::public.course_status
      and c.price = 0
  )
);

create policy "Admins can manage courses"
on public.courses for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage course modules"
on public.course_modules for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage lessons"
on public.lessons for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can read enrollments"
on public.enrollments for select to authenticated
using ((select public.is_admin()));

create policy "Admins can read lesson progress"
on public.lesson_progress for select to authenticated
using ((select public.is_admin()));

commit;
