begin;

alter type public.submission_status add value if not exists 'needs_revision';

commit;
