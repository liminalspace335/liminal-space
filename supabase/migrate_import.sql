-- ============================================================
-- [2단계] 환경설정 데이터 가져오기 — "새 Supabase 프로젝트"의 SQL Editor에서 실행
-- 먼저 그 프로젝트에 supabase_schema.sql 을 실행해 테이블이 있어야 합니다.
--
-- 사용법: 아래 PASTE_JSON_HERE 자리에, 1단계에서 복사한 JSON을 그대로 붙여넣으세요.
--         (앞뒤 $$ 표시는 그대로 두고, 그 사이에만 붙여넣기)
-- ============================================================
create temp table _imp(j jsonb);
insert into _imp values ($$PASTE_JSON_HERE$$::jsonb);

insert into public.branches
  select * from jsonb_populate_recordset(null::public.branches,      coalesce((select j->'branches'      from _imp),'[]'::jsonb)) on conflict (id) do nothing;
insert into public.classes
  select * from jsonb_populate_recordset(null::public.classes,       coalesce((select j->'classes'       from _imp),'[]'::jsonb)) on conflict (id) do nothing;
insert into public.class_details
  select * from jsonb_populate_recordset(null::public.class_details, coalesce((select j->'class_details' from _imp),'[]'::jsonb)) on conflict (id) do nothing;
insert into public.default_slots
  select * from jsonb_populate_recordset(null::public.default_slots, coalesce((select j->'default_slots' from _imp),'[]'::jsonb)) on conflict (id) do nothing;
insert into public.site_info
  select * from jsonb_populate_recordset(null::public.site_info,     coalesce((select j->'site_info'     from _imp),'[]'::jsonb)) on conflict (id) do nothing;

drop table _imp;
