# LIMINAL SPACE — 배포 가이드 (GitHub · Supabase · Railway)

정적 사이트(`index.html`, `admin.html`)를 Railway에 올리고, 데이터(신청·설정)는 Supabase에 저장합니다.
브라우저에서 Supabase에 직접 연결하며, `config.js`를 비워두면 로컬에서는 자동으로 브라우저 저장(localStorage)으로 동작합니다.

---

## 1) Supabase — 데이터베이스 준비
1. https://supabase.com 에서 프로젝트 생성(무료 플랜 가능).
2. 좌측 **SQL Editor** → New query → `supabase_schema.sql` 내용을 붙여넣고 **Run**.
   - `kv` 테이블과 공개 읽기/쓰기 정책(RLS), 초기 행이 생성됩니다.
3. 좌측 **Project Settings → API** 에서 다음 두 값을 복사:
   - **Project URL** (예: `https://abcd1234.supabase.co`)
   - **anon public** 키 (긴 토큰)

## 2) config.js — 키 입력
`config.js`를 열어 값을 채웁니다(이 anon 키는 공개되어도 되는 키입니다):
```js
window.SUPA_CONFIG = {
  url: "https://abcd1234.supabase.co",
  anonKey: "여기에 anon public 키"
};
```

## 3) GitHub — 코드 올리기
이 폴더(`LIMINAL SPACE`)를 그대로 새 GitHub 저장소에 올립니다. 터미널에서:
```bash
cd "LIMINAL SPACE"
git init
git add .
git commit -m "LIMINAL SPACE site"
git branch -M main
git remote add origin https://github.com/<본인계정>/<저장소>.git
git push -u origin main
```

## 4) Railway — 배포
1. https://railway.app → **New Project → Deploy from GitHub repo** → 위 저장소 선택.
2. Railway가 `package.json`/`railway.json`을 인식해 `node server.js`로 정적 사이트를 띄웁니다.
3. 배포 후 **Settings → Networking → Generate Domain** 으로 공개 URL 생성.
4. 접속:
   - 신청 페이지: `https://<도메인>/`
   - 관리자: `https://<도메인>/admin.html`

---

## 동작 방식 / 참고
- **데이터 저장**: 설정은 `kv` 테이블(JSON 한 행), 신청은 `applications` 테이블에 **행 단위**로 저장됩니다(동시 신청 경합 방지). 어드민에서 바꾸면 모든 방문자에게 반영돼요.
- **로컬 테스트**: `config.js`가 비어 있으면 localStorage로 동작(인터넷/DB 불필요). `npm start`로 로컬 서버(`http://localhost:3000`)도 가능합니다.
- **시간 기준**: 신청 가능 여부는 베트남 시간(UTC+7) 기준. 지난 날짜·시간, 미설정/휴무일은 신청 불가.
- **클래스 오픈**: 클래스설정에서 개별 저장한 날짜에만 신청이 열립니다.

## 보안 안내 (중요)
- 현재는 "간단 비밀번호(`liminal`)" 모드라, anon 키로 누구나 읽기/쓰기가 가능한 **공개 데모 수준** 보안입니다. 실제 운영 공개 URL에는 권장하지 않습니다.
- 운영 강화가 필요하면: ① 어드민을 **Supabase Auth(이메일 로그인)** 로 바꾸고 ② RLS 정책을 로그인 사용자만 쓰기 가능하도록 변경하세요. 요청 주시면 그 구조로 업그레이드해 드립니다.
- 어드민 비밀번호는 `admin.html`의 `const PW='liminal';` 에서 변경하세요.
- 신청은 `applications` 테이블에 행 단위로 저장되어 동시 신청에도 안전합니다.
