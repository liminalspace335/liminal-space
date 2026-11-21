-- ============================================================
-- 신청 출처(source) 컬럼 — 어드민 신청관리 "출처" 칸
--   home        홈페이지(공개 신청 페이지)  ← 기본값, 기존 신청은 모두 이 값으로 채워짐
--   direct      직접(어드민에서 수기 추가: 전화·방문 예약 등)
--   gyg / kkday / viator / klook / airbnb / tripadvisor   플랫폼 예약
-- ext_ref: 플랫폼 예약번호(예: GYG 예약번호). 같은 플랫폼·같은 번호는 한 번만 들어가도록 막아
--          메일 자동 반영(GYG 연동)이 같은 예약을 두 번 넣지 않게 한다.
--
-- ⚠️ 순서: 이 SQL을 먼저 실행한 뒤 사이트(store.js·admin)를 배포해야 함.
--    반대로 하면 저장할 때 "source 컬럼 없음" 오류가 난다.
-- 컬럼 추가만 하고 기존 신청 데이터는 수정·삭제하지 않는다. Supabase SQL Editor에서 1회 실행.
-- ============================================================

alter table public.applications add column if not exists source text default 'home';
alter table public.applications add column if not exists ext_ref text;

create unique index if not exists applications_source_ext_ref_uq
  on public.applications(source, ext_ref) where ext_ref is not null;

-- ---------- 확인 ----------
select source, count(*) from public.applications group by source;
