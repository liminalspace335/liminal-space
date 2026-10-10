-- 러시아어(ru) 지원: 다국어 컬럼 추가 + 현재 등록된 내용의 기본 번역 입력
-- 여러 번 실행해도 안전함(컬럼은 if not exists, 번역은 비어 있을 때만 채움)
-- ※ store.js(v65)가 이 컬럼들을 읽고 쓰므로, 사이트 배포 전에 먼저 실행해야 한다.

alter table public.branches      add column if not exists name_ru     text default '';
alter table public.branches      add column if not exists location_ru text default '';
alter table public.branches      add column if not exists hours_ru    text default '';
alter table public.classes       add column if not exists name_ru     text default '';
alter table public.classes       add column if not exists desc_ru     text default '';
alter table public.class_details add column if not exists detail_ru   text default '';

-- 지점: 호치민
update public.branches set
  name_ru     = coalesce(nullif(name_ru,''),     'Хошимин'),
  location_ru = coalesce(nullif(location_ru,''), location_ko),   -- 주소는 현지 표기 그대로
  hours_ru    = coalesce(nullif(hours_ru,''),    hours_ko)
where id = 'br_mqt85rqtqlmbfk';

-- 클래스
update public.classes set
  name_ru = coalesce(nullif(name_ru,''), 'Signature Scent Workshop'),
  desc_ru = coalesce(nullif(desc_ru,''), 'Более 100 ароматов · Создайте свой фирменный аромат')
where id = 'cl_mqj89f9wfi7bet';

update public.classes set
  name_ru = coalesce(nullif(name_ru,''), 'Корпоративные и групповые заказы'),
  desc_ru = coalesce(nullif(desc_ru,''), 'Организация мероприятий · Создание и поставка ароматов · Коллаборации')
where id = 'cl_mqj89f9w8yr6pw';

-- 용량별 상세(10·30·50ml 공통 문구)
update public.class_details set
  detail_ru = coalesce(nullif(detail_ru,''), 'В комплекте: духи + упаковка + бумажный пакет + мини-духи')
where id in ('cd_mqj8bhlsj5u048','cd_mqnyvhx5uaprnj','cd_mqnyvhx6ylndx7');

-- 갤러리 폴더명: 영문 고유명사라 러시아어도 같은 표기 사용(ko 값을 ru로 복사)
update public.site_info
set galleryfolders_json = (
  select coalesce(jsonb_agg(
    case when coalesce(f->'name'->>'ru','') = ''
      then jsonb_set(f, '{name,ru}', to_jsonb(coalesce(f->'name'->>'ko','')))
      else f end order by ord), '[]'::jsonb)::text
  from jsonb_array_elements(coalesce(nullif(galleryfolders_json,''),'[]')::jsonb) with ordinality as t(f, ord)
)
where id = 'main';

-- 확인
select 'branches' t, name_ru, location_ru, hours_ru from public.branches
union all select 'classes', name_ru, desc_ru, null from public.classes
union all select 'class_details', detail_ru, null, null from public.class_details;
