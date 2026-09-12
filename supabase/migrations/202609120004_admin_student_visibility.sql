begin;

create policy "Admins can read profiles"
on public.profiles for select to authenticated
using ((select public.is_admin()));

commit;
