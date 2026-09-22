/* Supabase 연결 설정.
 *   url     : Supabase 프로젝트 URL (REST 엔드포인트의 /rest/v1/ 제외한 부분)
 *   anonKey : Publishable 키 (또는 Legacy anon public 키). 브라우저 노출 OK.
 * 비워두면(로컬에서) 자동으로 localStorage 모드로 동작합니다.
 */
window.SUPA_CONFIG = {
  url: "https://euhuiktqoslmndozqpsr.supabase.co",
  anonKey: "sb_publishable_FrEHlpTzQpDmBh8Z8_2o_w_CKQomC2A"
};
/* 사이트 버전 — deploy.sh 실행 시 자동으로 +1 됨 (좌측 상단 로고 5번 클릭 시 표시) */
window.LS_VERSION = "v58";
/* 공개 예약 페이지 예약 가능 기간(오늘부터 N일) — app.js(날짜 선택 상한)와 store.js(공개 조회 시 스케줄 조회 범위)가
 * 반드시 같은 값을 써야 함(하나만 바꾸면 "선택은 되는데 데이터가 없어 빈 자리로 보이는" 불일치가 생김). */
window.RESERVATION_WINDOW_DAYS = 90;
