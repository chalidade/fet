-- Halaman Bukti Belajar menampilkan konsep yang sudah dicentang secara publik,
-- seperti status tahap. Catatan dan kode di stage_work tetap privat: fungsi ini
-- hanya mengembalikan kolom stage dan checked.
create or replace function public.public_checklist(p_user uuid)
returns table (stage text, checked integer[])
language sql
stable
security definer
set search_path = ''
as $$
  select w.stage, w.checked
  from public.stage_work w
  where w.user_id = p_user and cardinality(w.checked) > 0;
$$;

revoke all on function public.public_checklist(uuid) from public;
grant execute on function public.public_checklist(uuid) to anon, authenticated;
