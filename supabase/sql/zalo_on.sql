-- ============================================================
-- 잘로(ZNS) 알림 on/off 컬럼 — 어드민(환경설정 › 알림관리)에서 제어
-- Supabase SQL Editor에서 1회 실행
-- ============================================================
alter table public.site_info add column if not exists zalo_on boolean default false;

-- 확인
select id, notify_on, zalo_on from public.site_info where id = 'main';
