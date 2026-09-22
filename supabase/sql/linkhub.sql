-- ============================================================
-- 홈화면(링크허브) 설정 컬럼 — 어드민(홈화면)에서 제어
-- 아바타/이름/태그라인/QR표시 + 픽토그램(이메일·전화·구글맵·페이스북·인스타·틱톡·쓰레드) + 커스텀 버튼 목록
-- Supabase SQL Editor에서 1회 실행
-- ============================================================
alter table public.site_info add column if not exists linkhub_json text default '{}';

-- 확인
select id, linkhub_json from public.site_info where id = 'main';
