-- Centang peta konsep per tahap (nomor item dari halaman roadmap).
-- Disimpan di stage_work supaya ikut aturan RLS yang sama: hanya pemiliknya yang bisa membaca.
alter table public.stage_work
  add column if not exists checked integer[] not null default '{}'
  check (cardinality(checked) <= 500);
