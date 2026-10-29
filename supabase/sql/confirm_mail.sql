-- ============================================================
-- 예약자(고객) 확정메일 — 컬럼 + 트리거
-- Supabase SQL Editor에서 1회 실행. '여기_웹훅시크릿'만 실제 WEBHOOK_SECRET 값으로 교체.
-- ============================================================

-- 발송 상태 저장 컬럼
alter table public.applications add column if not exists confirm_mail text;          -- null=미발송, 'sent', 'failed'
alter table public.applications add column if not exists confirm_mail_at timestamptz; -- 마지막 발송 시각
alter table public.applications add column if not exists confirm_mail_err text;       -- 실패 사유
alter table public.applications add column if not exists lang text;                   -- 신청 당시 언어(ko/en/vi) → 확정메일 언어

-- 확정메일 사용 on/off (어드민 알림관리에서 제어)
alter table public.site_info add column if not exists confirm_mail_on boolean default false;

-- 트리거 함수: 확정 신청(INSERT) / 확정 전환 / 재발송(confirm_mail=null) 시 Edge Function 호출
create or replace function public.notify_confirm_mail()
returns trigger language plpgsql security definer as $$
begin
  if (NEW.status = 'confirmed' and coalesce(NEW.email,'') <> '') then
    if (TG_OP = 'INSERT' and NEW.confirm_mail is null)
       or (TG_OP = 'UPDATE' and NEW.confirm_mail = 'pending')                                     -- 재발송 요청(명시적)
       or (TG_OP = 'UPDATE' and NEW.confirm_mail is null and OLD.status is distinct from NEW.status)  -- 상태가 확정으로 전환
    then
      perform net.http_post(
        url := 'https://euhuiktqoslmndozqpsr.functions.supabase.co/confirm-mail',
        headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret','여기_웹훅시크릿'),
        body := jsonb_build_object('type', TG_OP, 'record', row_to_json(NEW))
      );
    end if;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_confirm_mail_ins on public.applications;
create trigger trg_confirm_mail_ins after insert on public.applications
  for each row execute function public.notify_confirm_mail();

drop trigger if exists trg_confirm_mail_upd on public.applications;
create trigger trg_confirm_mail_upd after update on public.applications
  for each row execute function public.notify_confirm_mail();
