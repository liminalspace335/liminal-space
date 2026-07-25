// ============================================================
// LIMINAL SPACE — 당일 예약 확정 재알림(리마인더) Zalo ZNS 발송
// ------------------------------------------------------------
// 트리거: pg_cron이 매 10분마다 public.trigger_zalo_remind()를 실행 →
//         "재알림 사용중 + 오늘 아직 안 보냄 + 설정 시각(베트남) 지남" 조건일 때만
//         이 Edge Function을 호출한다(자세한 스케줄 조건은 SQL 쪽에서 판단).
// 동작:  오늘(베트남 날짜) want_date가 오늘이고 status가 'confirmed'인 신청 전원에게
//        예약확인과 동일한 승인 템플릿으로 ZNS 재발송한다.
//
// body: { date?: 'YYYY-MM-DD' }  (없으면 서버가 베트남 오늘 날짜로 계산)
//
// 필요한 시크릿 (기존 zalo-notify와 동일 — 이미 등록되어 있으면 추가 설정 불필요):
//   ZALO_APP_ID, ZALO_APP_SECRET, ZALO_TEMPLATE_ID, WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  ← Edge 런타임이 자동 주입
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_ID        = Deno.env.get("ZALO_APP_ID")!;
const APP_SECRET    = Deno.env.get("ZALO_APP_SECRET")!;
const TEMPLATE_ID   = Deno.env.get("ZALO_TEMPLATE_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function vnToday(): string {
  const now = new Date();
  const vn = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${vn.getFullYear()}-${p(vn.getMonth() + 1)}-${p(vn.getDate())}`;
}
function toVNDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "").trim());
  if (!m) return String(iso || "");
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function normVNPhone(raw: string): string {
  let d = (raw || "").replace(/[^0-9]/g, "");
  if (d.startsWith("840")) d = "84" + d.slice(3);
  else if (d.startsWith("84")) { /* 그대로 */ }
  else if (d.startsWith("0")) d = "84" + d.slice(1);
  else d = "84" + d;
  return d;
}
async function getAccessToken(): Promise<string> {
  const { data: row } = await db.from("zalo_token").select("*").eq("id", 1).single();
  const now = Date.now();
  const exp = row?.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (row?.access_token && exp > now + 120_000) return row.access_token;
  if (!row?.refresh_token) throw new Error("zalo_token.refresh_token 없음");
  const body = new URLSearchParams({ refresh_token: row.refresh_token, app_id: APP_ID, grant_type: "refresh_token" });
  const r = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: APP_SECRET },
    body,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("토큰 갱신 실패: " + JSON.stringify(j));
  const newExp = new Date(now + (Number(j.expires_in) || 3600) * 1000).toISOString();
  await db.from("zalo_token").update({
    access_token: j.access_token, refresh_token: j.refresh_token || row.refresh_token,
    expires_at: newExp, updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return j.access_token;
}
async function classInfo(id: string | null): Promise<{ name: string; inquiry: boolean }> {
  if (!id) return { name: "", inquiry: false };
  const { data } = await db.from("classes").select("name_ko,name_en,name_vi,inquiry_only").eq("id", id).single();
  return { name: data?.name_vi || data?.name_en || data?.name_ko || "", inquiry: data?.inquiry_only === true };
}
async function log(app_id: number, phone: string, ok: boolean, detail: string) {
  try { await db.from("zalo_log").insert({ app_id, phone, ok, detail: ("REMIND: " + detail).slice(0, 500) }); } catch (_) { /* noop */ }
}

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  let payload: any = {};
  try { payload = await req.json(); } catch { /* body 없어도 됨 */ }

  const { data: si } = await db.from("site_info").select("zalo_remind_on").eq("id", "main").single();
  if (si?.zalo_remind_on !== true) {
    return new Response(JSON.stringify({ skipped: "remind_off" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const date = payload?.date || vnToday();
  const { data: apps, error } = await db.from("applications")
    .select("id,name,phone,class_id,want_date,want_time,people,msg")
    .eq("want_date", date).eq("status", "confirmed");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (!apps || !apps.length) return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });

  let token = "";
  try { token = await getAccessToken(); } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  let sent = 0, failed = 0;
  for (const a of apps) {
    const phone = normVNPhone(a.phone || "");
    if (phone.length < 9) { await log(a.id, phone, false, "전화번호 없음/형식 오류"); failed++; continue; }
    const ci = await classInfo(a.class_id);
    if (ci.inquiry) { await log(a.id, phone, false, "문의(예약아님) — 재알림 스킵"); continue; }
    const template_data: Record<string, string> = {
      name: a.name || "", phone: a.phone || "", class: ci.name,
      date: toVNDate(a.want_date || ""), time: a.want_time || "", people: String(a.people || "1"),
    };
    try {
      const r = await fetch("https://business.openapi.zalo.me/message/template", {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: token },
        body: JSON.stringify({ phone, template_id: TEMPLATE_ID, template_data, tracking_id: "remind-" + a.id }),
      });
      const j = await r.json();
      const ok = j?.error === 0;
      await log(a.id, phone, ok, JSON.stringify(j));
      if (ok) sent++; else failed++;
    } catch (e) {
      await log(a.id, phone, false, String(e)); failed++;
    }
  }
  return new Response(JSON.stringify({ ok: true, date, total: apps.length, sent, failed }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
