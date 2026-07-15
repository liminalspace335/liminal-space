-- ============================================================
-- 공개(비로그인) 신청 페이지가 "이 시간대 잔여 인원"을 계산할 수 있도록
-- 개인정보 없이 정원 계산에 필요한 컬럼만 노출하는 뷰.
-- 배경: applications 테이블 자체는 로그인한 관리자만 조회 가능하도록 막아뒀는데(고객 개인정보 보호),
--       그 여파로 공개 신청 페이지도 "이미 몇 명 예약했는지"를 못 보게 되어 정원 체크가 무력화됐다.
--       이 뷰는 이름/전화번호/이메일 등은 빼고 정원 계산에만 쓰는 컬럼만 공개로 열어준다.
-- ============================================================

create or replace view public.applications_public as
select id, branch_id, class_id, want_date, want_time, people, status
from public.applications;

grant select on public.applications_public to anon, authenticated;

-- ---------- 확인 ----------
select * from public.applications_public limit 5;
