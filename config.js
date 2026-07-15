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
window.LS_VERSION = "v32";
