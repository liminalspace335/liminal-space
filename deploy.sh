#!/usr/bin/env bash
# LIMINAL SPACE 배포 스크립트
#  - config.js 의 LS_VERSION 을 자동으로 +1 (하드코딩 X)
#  - 변경분 커밋 후 push  → 이 버전이 곧 실제 배포 버전
# 사용법:  ./deploy.sh "커밋 메시지(선택)"
set -e
cd "$(dirname "$0")"

# 현재 버전 숫자 추출 (예: v3 → 3), 없으면 0
cur=$(grep -oE 'LS_VERSION *= *"v[0-9]+"' config.js | grep -oE '[0-9]+' | head -1)
[ -z "$cur" ] && cur=0
next=$((cur + 1))

# config.js 의 버전 문자열을 v(next) 로 교체 (macOS/BSD sed)
sed -i '' -E 's/(LS_VERSION *= *"v)[0-9]+(")/\1'"$next"'\2/' config.js

# 모든 HTML 의 자산 캐시버스터(?v=N) 를 새 버전으로 교체 → 브라우저가 새 config/app/styles 를 즉시 받음
for f in index.html brand.html classes.html gallery.html location.html space.html admin/index.html; do
  [ -f "$f" ] && sed -i '' -E "s/(styles\.css|config\.js|store\.js|app\.js)\?v=[0-9]+/\1?v=$next/g" "$f"
done

msg="${1:-deploy}"
git add -u                      # 추적 중인 코드 파일만 (큰 미디어 제외)
git add config.js               # 버전 변경 포함
git commit -m "$msg (v$next)"
git push origin main

echo "✅ 배포 완료: v$next  —  로고 5번 클릭으로 확인"
