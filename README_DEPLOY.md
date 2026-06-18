# LIMINAL SPACE 배포 가이드 (GitHub Pages · 무료)

정적 사이트라 GitHub Pages만으로 호스팅합니다. 별도 서버(Railway 등) 불필요.

## 구조
- 공개(신청) 페이지: `index.html` → `https://<아이디>.github.io/<리포>/`
- 어드민 페이지: `admin/index.html` → `https://<아이디>.github.io/<리포>/admin`
- 데이터: Supabase (브라우저에서 직접 연결 — `config.js`, `store.js`)

## 1. 코드 푸시
```bash
cd "/Users/charlesbro/Desktop/ALLIED/ALLIED/LIMINAL SPACE/LIMINAL SPACE"
git add .
git commit -m "Switch to GitHub Pages: /admin path, drop Railway (v3)"
git push
```

## 2. GitHub Pages 켜기 (최초 1회)
1. GitHub에서 이 리포 → **Settings → Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` / 폴더 `/ (root)` → **Save**
4. 1~2분 뒤 상단에 공개 URL이 표시됨

## 3. 접속
- 신청 페이지: `https://<아이디>.github.io/<리포>/`
- 어드민: 위 주소 뒤에 `/admin` (예: `https://<아이디>.github.io/<리포>/admin`)

## 이후 업데이트
파일 수정 후 `git add . && git commit -m "..." && git push` 하면 GitHub Pages가 자동 재배포(1~2분).

## 참고
- `.nojekyll` 파일은 GitHub의 Jekyll 처리를 끄기 위한 것(그대로 둘 것).
- 나중에 `liminalspace.com` 같은 커스텀 도메인을 붙이려면: 도메인 구매 → Settings → Pages → Custom domain 입력 → 등록업체 DNS에 CNAME 추가.
- Railway는 더 이상 사용하지 않으므로, 기존 Railway 프로젝트는 대시보드에서 삭제해도 됩니다.
