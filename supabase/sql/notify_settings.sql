-- ============================================================
-- 신청 이메일 알림 설정 — site_info 'main' 행에 이메일/사용여부 저장
-- (없으면 삽입, 있으면 해당 값만 갱신 — 다른 컬럼은 건드리지 않음)
-- 'your@email.com' 을 실제 받을 이메일로 바꿔서 Supabase SQL Editor에서 실행하세요.
-- 여러 명이면 콤마로: 'a@x.com, b@y.com'
-- ============================================================

-- (컬럼이 없다면 먼저 추가)
alter table public.site_info add column if not exists notify_email text default '';
alter table public.site_info add column if not exists notify_on boolean default true;

-- upsert
insert into public.site_info (id, notify_email, notify_on)
values ('main', 'your@email.com', true)
on conflict (id) do update
  set notify_email = excluded.notify_email,
      notify_on   = excluded.notify_on;

-- 확인
select id, notify_email, notify_on from public.site_info where id = 'main';
