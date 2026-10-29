-- ============================================================
-- 중복예약(오버부킹) 방지 — DB 트리거로 서버단에서 최종 확인
-- ------------------------------------------------------------
-- 문제: 지금까지 정원 체크는 브라우저(클라이언트)에서만 이뤄졌다. 두 손님이 마지막 한 자리를
--   거의 동시에 신청하면, 둘 다 "정원 남음"으로 보고 둘 다 신청이 들어갈 수 있었다(레이스 컨디션).
-- 해결: applications INSERT 시점에 서버(트리거)에서 다시 한번 그 (지점,날짜,시간,클래스)의
--   정원을 확인하고, advisory lock으로 같은 슬롯에 대한 동시 삽입을 한 번에 하나씩만 처리되게
--   직렬화한다. 정원을 넘으면 삽입 자체를 거부한다.
-- 적용 범위: 고객이 직접 신청하는 공개(anon) 경로에만 적용된다. 관리자(로그인) 쪽 추가/수정은
--   지금처럼 자유롭게 허용된다(전화 예약 등 특수 상황을 수기로 처리할 수 있어야 하므로).
-- 참고: 정원 정보를 정확히 못 찾는 경우(문의 전용 클래스 등 날짜/시간이 없는 신청)는 그냥 통과시킨다
--   — 이 트리거의 목적은 "확실히 정원을 넘기는 경우"만 막는 것이지, 애매한 경우까지 막는 게 아니다.
-- Supabase SQL Editor에서 1회 실행하세요.
-- ============================================================

-- people 컬럼은 text라 값이 지저분할 수 있다(빈 문자열, 과거 잘못 들어간 비숫자 값 등).
-- ::int로 바로 캐스팅하면 그중 하나만 걸려도 SQL 에러가 나서 그 슬롯의 신규 신청 전체가 막혀버리므로,
-- 숫자가 아니면 조용히 1명으로 취급하는 안전한 변환 함수를 따로 둔다.
create or replace function public._safe_people_int(t text)
returns integer language sql immutable as $$
  select case when t ~ '^[0-9]+$' then t::int else 1 end;
$$;

create or replace function public.check_application_capacity()
returns trigger
language plpgsql
security definer
as $$
declare
  v_cap integer;
  v_booked integer;
  v_lock_key bigint;
begin
  -- 관리자(로그인) 쪽은 체크 없이 통과 — 이 트리거는 고객 직접 신청(anon) 레이스만 막기 위함
  if coalesce(auth.role(), 'anon') <> 'anon' then
    return new;
  end if;
  if new.status = 'cancel' or new.branch_id is null or new.want_date is null or new.want_time is null then
    return new;
  end if;

  -- 같은 (지점,날짜,시간,클래스)에 대한 동시 삽입을 한 번에 하나씩만 처리되게 직렬화
  v_lock_key := hashtextextended(
    coalesce(new.branch_id,'') || '|' || new.want_date || '|' || new.want_time || '|' || coalesce(new.class_id,''),
    0
  );
  perform pg_advisory_xact_lock(v_lock_key);

  -- 그 날짜의 개별 설정(schedule_slots)이 있으면 그 cap, 없으면 기본 스케줄(default_slots)의 cap
  select cap into v_cap from public.schedule_slots
    where branch_id = new.branch_id and sched_date = new.want_date and time = new.want_time
      and class_id is not distinct from new.class_id
    limit 1;
  if v_cap is null then
    select cap into v_cap from public.default_slots
      where branch_id = new.branch_id and time = new.want_time
        and class_id is not distinct from new.class_id
      limit 1;
  end if;
  if v_cap is null then
    return new;   -- 정원 정보를 못 찾으면(문의 전용 등) 잘못 막지 않도록 통과
  end if;

  select coalesce(sum(public._safe_people_int(people)), 0) into v_booked
    from public.applications
    where branch_id = new.branch_id and want_date = new.want_date and want_time = new.want_time
      and class_id is not distinct from new.class_id
      and status <> 'cancel';

  if v_booked + public._safe_people_int(new.people) > v_cap then
    raise exception 'CAPACITY_FULL: 이 시간대는 정원이 마감되었습니다.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_application_capacity on public.applications;
create trigger trg_check_application_capacity
before insert on public.applications
for each row execute function public.check_application_capacity();

-- ---------- 확인 ----------
select tgname, tgenabled from pg_trigger where tgname = 'trg_check_application_capacity';
