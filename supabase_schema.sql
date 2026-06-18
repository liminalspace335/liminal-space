-- LIMINAL SPACE — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- 1) 설정 저장용 kv (JSON 한 행)
create table if not exists public.kv (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kv enable row level security;
drop policy if exists kv_select on public.kv;
drop policy if exists kv_insert on public.kv;
drop policy if exists kv_update on public.kv;
create policy kv_select on public.kv for select using (true);
create policy kv_insert on public.kv for insert with check (true);
create policy kv_update on public.kv for update using (true) with check (true);
insert into public.kv(key, data) values ('liminal_settings', '{}'::jsonb)
  on conflict (key) do nothing;

-- 2) 신청 저장용 applications (행 단위 — 동시 신청 경합 방지)
create table if not exists public.applications (
  id bigint primary key,
  created_at timestamptz not null default now(),
  branch text,
  name text,
  phone text,
  email text,
  nationality text,
  class_name text,
  size text,
  want_date text,
  want_time text,
  people text,
  msg text,
  status text not null default 'new'
);
create index if not exists applications_date_idx on public.applications(want_date);
create index if not exists applications_branch_idx on public.applications(branch);

alter table public.applications enable row level security;
drop policy if exists app_select on public.applications;
drop policy if exists app_insert on public.applications;
drop policy if exists app_update on public.applications;
drop policy if exists app_delete on public.applications;
-- 공개 데모(간단 비밀번호 모드): anon 키로 읽기/쓰기 허용
-- (운영 강화 시: 신청 생성만 anon 허용, 조회/수정/삭제는 인증 사용자만으로 변경 권장)
create policy app_select on public.applications for select using (true);
create policy app_insert on public.applications for insert with check (true);
create policy app_update on public.applications for update using (true) with check (true);
create policy app_delete on public.applications for delete using (true);
