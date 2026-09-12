begin;

alter table public.quizzes
  add column is_published boolean not null default false,
  add column updated_at timestamptz not null default now();

alter table public.quiz_attempts
  add column max_score numeric(8, 2) not null default 0 check (max_score >= 0),
  add column percentage numeric(5, 2) not null default 0 check (percentage between 0 and 100),
  add column correct_answers integer not null default 0 check (correct_answers >= 0),
  add column total_questions integer not null default 0 check (total_questions >= 0),
  add column answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  add column result_summary jsonb not null default '[]'::jsonb check (jsonb_typeof(result_summary) = 'array'),
  add column submission_token uuid not null default extensions.gen_random_uuid(),
  add constraint quiz_attempts_score_within_max check (score <= max_score),
  add constraint quiz_attempts_correct_within_total check (correct_answers <= total_questions),
  add constraint quiz_attempts_submission_unique unique (student_id, quiz_id, submission_token);

create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();

drop policy "Enrolled students can read quizzes" on public.quizzes;

create policy "Enrolled students can read published quizzes"
on public.quizzes for select to authenticated
using (
  is_published
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = quizzes.lesson_id
      and e.student_id = (select auth.uid())
      and e.status in ('active', 'completed')
  )
);

create policy "Admins can manage quizzes"
on public.quizzes for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can manage quiz questions"
on public.quiz_questions for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins can read quiz attempts"
on public.quiz_attempts for select to authenticated
using ((select public.is_admin()));

create or replace function public.get_quiz_questions(p_quiz_id uuid)
returns table (
  question_id uuid,
  question text,
  options jsonb,
  points integer,
  sort_order integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, q.question, q.options, q.points, q.sort_order
  from public.quiz_questions q
  join public.quizzes z on z.id = q.quiz_id
  join public.lessons l on l.id = z.lesson_id
  join public.course_modules m on m.id = l.module_id
  join public.enrollments e on e.course_id = m.course_id
  join public.profiles p on p.id = e.student_id
  where q.quiz_id = p_quiz_id
    and z.is_published
    and e.student_id = (select auth.uid())
    and e.status in ('active', 'completed')
    and p.role = 'student'::public.user_role
  order by q.sort_order, q.id;
$$;

create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers jsonb,
  p_submission_token uuid
)
returns table (
  attempt_id uuid,
  score numeric,
  max_score numeric,
  percentage numeric,
  passed boolean,
  correct_answers integer,
  total_questions integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_passing_score numeric;
  v_score numeric := 0;
  v_max_score numeric := 0;
  v_percentage numeric := 0;
  v_correct integer := 0;
  v_total integer := 0;
  v_attempt_id uuid;
  v_summary jsonb;
begin
  if v_student_id is null or p_quiz_id is null or p_submission_token is null then
    raise exception 'QUIZ_ACCESS_DENIED';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'QUIZ_ANSWERS_INVALID';
  end if;

  select z.passing_score into v_passing_score
  from public.quizzes z
  join public.lessons l on l.id = z.lesson_id
  join public.course_modules m on m.id = l.module_id
  join public.enrollments e on e.course_id = m.course_id
  join public.profiles p on p.id = e.student_id
  where z.id = p_quiz_id
    and z.is_published
    and e.student_id = v_student_id
    and e.status in ('active', 'completed')
    and p.role = 'student'::public.user_role;

  if v_passing_score is null then
    raise exception 'QUIZ_ACCESS_DENIED';
  end if;

  select qa.id into v_attempt_id
  from public.quiz_attempts qa
  where qa.student_id = v_student_id
    and qa.quiz_id = p_quiz_id
    and qa.submission_token = p_submission_token;

  if v_attempt_id is not null then
    return query
    select qa.id, qa.score, qa.max_score, qa.percentage, qa.passed, qa.correct_answers, qa.total_questions
    from public.quiz_attempts qa where qa.id = v_attempt_id;
    return;
  end if;

  select count(*)::integer, coalesce(sum(q.points), 0)
  into v_total, v_max_score
  from public.quiz_questions q
  where q.quiz_id = p_quiz_id;

  if v_total = 0 then
    raise exception 'QUIZ_EMPTY';
  end if;
  if (select count(*) from jsonb_object_keys(p_answers)) <> v_total
    or exists (
      select 1 from public.quiz_questions q
      where q.quiz_id = p_quiz_id
        and (
          jsonb_typeof(q.options) <> 'array'
          or jsonb_typeof(q.correct_answer) <> 'string'
          or not (p_answers ? q.id::text)
          or jsonb_typeof(p_answers -> q.id::text) <> 'string'
          or not (q.options @> jsonb_build_array(p_answers -> q.id::text))
        )
    ) then
    raise exception 'QUIZ_ANSWERS_INVALID';
  end if;

  select
    coalesce(sum(case when p_answers -> q.id::text = q.correct_answer then q.points else 0 end), 0),
    count(*) filter (where p_answers -> q.id::text = q.correct_answer)::integer,
    jsonb_agg(jsonb_build_object(
      'question_id', q.id,
      'question', q.question,
      'selected_answer', p_answers -> q.id::text,
      'correct_answer', q.correct_answer,
      'correct', p_answers -> q.id::text = q.correct_answer,
      'points', q.points,
      'awarded_points', case when p_answers -> q.id::text = q.correct_answer then q.points else 0 end
    ) order by q.sort_order, q.id)
  into v_score, v_correct, v_summary
  from public.quiz_questions q
  where q.quiz_id = p_quiz_id;

  v_percentage := round((v_score / v_max_score) * 100, 2);

  insert into public.quiz_attempts (
    student_id, quiz_id, score, max_score, percentage, passed,
    correct_answers, total_questions, answers, result_summary, submission_token
  ) values (
    v_student_id, p_quiz_id, v_score, v_max_score, v_percentage,
    v_percentage >= v_passing_score, v_correct, v_total,
    p_answers, v_summary, p_submission_token
  ) returning id into v_attempt_id;

  return query
  select qa.id, qa.score, qa.max_score, qa.percentage, qa.passed, qa.correct_answers, qa.total_questions
  from public.quiz_attempts qa where qa.id = v_attempt_id;
end;
$$;

revoke all on function public.get_quiz_questions(uuid) from public, anon;
revoke all on function public.submit_quiz_attempt(uuid, jsonb, uuid) from public, anon;
grant execute on function public.get_quiz_questions(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb, uuid) to authenticated;

commit;
