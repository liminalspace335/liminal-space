// ============================================================
// LIMINAL SPACE — Zalo OA refresh_token 최초 발급 도우미 (1회용)
// ------------------------------------------------------------
// Zalo OA OAuth v4(PKCE) 흐름으로 authorization code → refresh_token 을 받습니다.
//
// 실행:
//   ZALO_APP_ID=2820653980210083359 ZALO_APP_SECRET=<앱시크릿> node zalo_get_token.mjs
//
//   (필요 시 redirect_uri 를 바꾸려면 ZALO_REDIRECT_URI 도 지정)
//   기본 redirect_uri = https://liminalspace335.github.io/liminal-space/zalo-callback.html
//
// ⚠️ 앱 시크릿은 환경변수로만 전달하세요. 코드/채팅에 넣지 말 것.
// ============================================================
import crypto from "node:crypto";
import readline from "node:readline";

const APP_ID = process.env.ZALO_APP_ID;
const APP_SECRET = process.env.ZALO_APP_SECRET;
const REDIRECT_URI = process.env.ZALO_REDIRECT_URI
  || "https://liminalspace335.github.io/liminal-space/zalo-callback.html";

if (!APP_ID || !APP_SECRET) {
  console.error("환경변수 ZALO_APP_ID 와 ZALO_APP_SECRET 를 설정한 뒤 실행하세요.");
  process.exit(1);
}

// PKCE: code_verifier / code_challenge(S256)
const b64url = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const verifier = b64url(crypto.randomBytes(43));
const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());

const permUrl = `https://oauth.zaloapp.com/v4/oa/permission?app_id=${APP_ID}`
  + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  + `&code_challenge=${challenge}&state=liminal`;

console.log("\n================ STEP 1 ================");
console.log("아래 URL 을 브라우저에서 여세요. (반드시 OA 관리자 계정으로 로그인된 상태)");
console.log("→ 'Cho phép(허용)' 을 누르면 콜백 페이지로 이동하며 code 가 표시됩니다.\n");
console.log(permUrl);
console.log("\n================ STEP 2 ================");
console.log("콜백 페이지에 표시된 code 값을 복사해서 아래에 붙여넣고 Enter.");
console.log("(code 는 발급 후 수 분 내 만료되니 바로 붙여넣으세요)\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("code 붙여넣기 > ", async (codeRaw) => {
  const code = (codeRaw || "").trim();
  if (!code) { console.log("code 가 비었습니다. 다시 실행하세요."); rl.close(); return; }
  try {
    const body = new URLSearchParams({
      code, app_id: APP_ID, grant_type: "authorization_code", code_verifier: verifier,
    });
    const r = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: APP_SECRET },
      body,
    });
    const j = await r.json();
    console.log("\n[Zalo 응답]", JSON.stringify(j, null, 2));
    if (j.refresh_token) {
      console.log("\n✅ refresh_token 발급 성공! 아래 SQL 을 Supabase SQL Editor 에서 실행하세요:\n");
      console.log(`update public.zalo_token set refresh_token = '${j.refresh_token}', expires_at = now() where id = 1;\n`);
    } else {
      console.log("\n⚠️ refresh_token 이 없습니다. 원인 후보:");
      console.log(" - code 만료(수 분 지남) → STEP1 URL 다시 열어 새 code 로 재시도");
      console.log(" - redirect_uri 불일치 → Zalo 앱에 등록한 콜백 URL 과 정확히 같아야 함");
      console.log(" - 앱 시크릿 오타");
    }
  } catch (e) {
    console.log("\n오류:", String(e));
  }
  rl.close();
});
