-- ============================================================
-- [1단계] 환경설정 데이터 내보내기 — "기존(옛) Supabase 프로젝트"의 SQL Editor에서 실행
-- 실행하면 결과 1칸에 JSON이 나옵니다. 그 칸을 클릭해 "전체 복사" 하세요.
-- (신청 applications, 날짜별 슬롯 schedule_* 은 제외 — 환경설정만)
-- ============================================================
select jsonb_build_object(
  'branches',      (select jsonb_agg(to_jsonb(t)) from public.branches t),
  'classes',       (select jsonb_agg(to_jsonb(t)) from public.classes t),
  'class_details', (select jsonb_agg(to_jsonb(t)) from public.class_details t),
  'default_slots', (select jsonb_agg(to_jsonb(t)) from public.default_slots t),
  'site_info',     (select jsonb_agg(to_jsonb(t)) from public.site_info t)
) as export;
