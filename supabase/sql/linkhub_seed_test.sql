-- ============================================================
-- 홈화면(링크허브) 테스트용 값 — 어드민 환경설정에 이미 등록된
-- 실제 지점 소셜/연락처 값 + 향 성격테스트 버튼 + 언어별(이름·버튼 제목) 텍스트를 채웁니다(배포 전 로컬 테스트용).
-- Supabase SQL Editor에서 1회 실행. 이후엔 어드민 "홈화면" 탭에서 언어 탭을 바꿔가며 자유롭게 수정 가능.
-- ============================================================
update public.site_info set linkhub_json = '{
  "name": {"vi":"LIMINAL SPACE","en":"LIMINAL SPACE","ko":"리미널 스페이스"},
  "showQr": true,
  "icons": [
    {"type":"email","enabled":true,"order":0,"value":"liminalspace335@gmail.com"},
    {"type":"phone","enabled":true,"order":1,"value":"0818880504"},
    {"type":"googlemap","enabled":true,"order":2,"value":"https://maps.app.goo.gl/nSZv3Nfd9kfWTm7d9"},
    {"type":"facebook","enabled":true,"order":3,"value":"https://www.facebook.com/profile.php?id=61590254235276&locale=ko_KR"},
    {"type":"instagram","enabled":true,"order":4,"value":"https://www.instagram.com/liminalspace_sg"},
    {"type":"tiktok","enabled":true,"order":5,"value":"https://www.tiktok.com/@liminal_space33.5"},
    {"type":"threads","enabled":false,"order":6,"value":""}
  ],
  "links": [
    {"id":"lhl_seed1","title":{"vi":"Đặt lịch","en":"Reservations","ko":"예약"},"image":"","url":"classes.html","enabled":true,"order":0},
    {"id":"lhl_seed2","title":{"vi":"Facebook","en":"Facebook","ko":"페이스북"},"image":"","url":"https://www.facebook.com/profile.php?id=61590254235276&locale=ko_KR","enabled":true,"order":1},
    {"id":"lhl_seed3","title":{"vi":"Instagram","en":"Instagram","ko":"인스타그램"},"image":"","url":"https://www.instagram.com/liminalspace_sg","enabled":true,"order":2},
    {"id":"lhl_seed4","title":{"vi":"Tiktok","en":"Tiktok","ko":"틱톡"},"image":"","url":"https://www.tiktok.com/@liminal_space33.5","enabled":true,"order":3},
    {"id":"lhl_seed5","title":{"vi":"Google Maps","en":"Google Maps","ko":"구글맵"},"image":"","url":"https://maps.app.goo.gl/nSZv3Nfd9kfWTm7d9","enabled":true,"order":4},
    {"id":"lhl_seed6","title":{"vi":"Kiểm tra tính cách hương","en":"Personality Test","ko":"향 성격테스트"},"image":"","url":"https://liminalspace335.github.io/whats-your-drink/","enabled":true,"order":5}
  ]
}' where id = 'main';

-- 확인
select id, linkhub_json from public.site_info where id = 'main';
