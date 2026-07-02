# 신청 이메일 알림 설정 (Resend)

신청이 접수되면(applications INSERT) → Supabase Database Webhook → Edge Function `app-notify` → Resend로 이메일 발송.
**받는 이메일 주소와 알림 on/off 는 어드민(환경설정 › 사이트정보)에서 관리**합니다. API 키만 secret으로 넣습니다.

## 0. 사전
- Supabase에 `notify_email`, `notify_on` 컬럼 추가 SQL 1회 실행:
  ```sql
  alter table public.site_info add column if not exists notify_email text default '';
  alter table public.site_info add column if not exists notify_on boolean default true;
  ```
- 어드민 › 환경설정 › 사이트정보에서 **신청 알림 이메일** 입력 + **이메일 알림 사용** 체크 → 저장.

## 1. Resend 준비
1. resend.com 로그인(GitHub SSO 이미 완료) → **API Keys** → **Create API Key** → 키 복사(한 번만 보임).
   - ⚠️ 이 키는 어디에도(채팅·코드) 붙여넣지 말 것. 아래 3번에서 secret으로만 등록.
2. 발신주소:
   - 빠른 테스트: 기본 `onboarding@resend.dev` 사용 가능. 단, **도메인 인증 전에는 "내 계정 이메일"로만** 발송돼요(가입 이메일로 받는 건 OK).
   - 정식: Resend → **Domains** 에서 도메인 인증(DNS 추가) 후 `noreply@yourdomain` 으로 발송 가능 → 아무 주소로나 발송 OK.

## 2. Edge Function 배포 (Supabase CLI)
```bash
cd "/Users/charlesbro/Desktop/ALLIED/LIMINAL SPACE/LIMINAL SPACE"
supabase functions deploy app-notify --project-ref euhuiktqoslmndozqpsr
```

## 3. 시크릿 등록 (코드에 키 안 넣음)
```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxx \
  FROM_EMAIL="LIMINAL SPACE <onboarding@resend.dev>" \
  WEBHOOK_SECRET=$(openssl rand -hex 16) --project-ref euhuiktqoslmndozqpsr
```
- 도메인 인증을 했다면 FROM_EMAIL을 `noreply@yourdomain` 으로.
- (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 자동 주입 — 등록 불필요)

## 4. Database Webhook 연결
Supabase Dashboard → Database → **Webhooks** → Create
- Table: `applications`, Events: **Insert**
- Type: **HTTP Request**, Method: **POST**
- URL: `https://euhuiktqoslmndozqpsr.functions.supabase.co/app-notify`
- HTTP Headers: `x-webhook-secret: <위 WEBHOOK_SECRET 값과 동일>`

## 5. 테스트
- 사이트에서 실제로 신청 1건 접수 → 설정한 이메일로 알림 도착 확인.
- 안 오면: 어드민에서 이메일/알림사용 저장됐는지, Resend 발신 제한(도메인 인증 전엔 본인 계정 이메일만) 확인.
- Edge Function 로그: Dashboard → Edge Functions → app-notify → Logs.

## 비용
- Resend 무료 한도 내에서 무료(가입 시 한도 확인). 신청 건마다 1통.
