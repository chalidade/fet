-- Situs belajar lain (misalnya roadmap back-end) memakai project Supabase yang sama.
-- Supaya slug tahapnya tidak bentrok dengan front-end ("01-internet"), slug boleh diberi
-- prefix track: "be-01-http". Slug lama tanpa prefix tetap valid.
alter table public.stage_progress drop constraint if exists stage_progress_stage_check;
alter table public.stage_progress add constraint stage_progress_stage_check
  check (stage ~ '^([a-z]{2,8}-)?[0-9]{2}-[a-z0-9-]+$');

alter table public.stage_work drop constraint if exists stage_work_stage_check;
alter table public.stage_work add constraint stage_work_stage_check
  check (stage ~ '^([a-z]{2,8}-)?[0-9]{2}-[a-z0-9-]+$');

alter table public.posts drop constraint if exists posts_stage_check;
alter table public.posts add constraint posts_stage_check
  check (stage ~ '^([a-z]{2,8}-)?[0-9]{2}-[a-z0-9-]+$');
