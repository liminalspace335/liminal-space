# vendor

- `supabase-js-2.118.0.js` — `@supabase/supabase-js@2.118.0` npm 공식 패키지의 `dist/umd/supabase.js` 원본(수정 없음).
  외부 CDN(jsdelivr)이 느려지거나 막혀도 사이트가 열리도록, 그리고 버전이 몰래 바뀌지 않도록 사이트 안에 고정해 둔 파일.
- 업데이트: `npm pack @supabase/supabase-js@<버전>` → `package/dist/umd/supabase.js`를 새 이름으로 복사 → HTML 7곳(공개 6개 + admin)의 경로 변경. 1년에 한두 번 점검 권장.
