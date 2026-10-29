-- 서브페이지(소개·공간·클래스·갤러리·위치) 상단 '페이지 설명' 저장 칸 — 2026-10-30 Supabase SQL Editor에서 실행 완료
-- 기존 데이터는 건드리지 않는 nullable 컬럼 추가만. 값 형식: {"space":{"ko":"…","vi":"…","en":"…","ru":"…"}, "brand":{…}, …}
-- ⚠️ 이 컬럼이 없는 DB에 새 store.js를 배포하면 site_info 저장이 실패하므로, 반드시 이 SQL을 먼저 실행할 것.
alter table public.site_info add column if not exists page_desc_json text null;
