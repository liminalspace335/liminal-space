// ============================================================
// LIMINAL SPACE — 예약자(고객) 확정메일 자동발송 (Supabase Edge Function + Resend)
// ------------------------------------------------------------
// 트리거: applications INSERT(확정) / 확정 전환 / 재발송(confirm_mail=null) → DB 트리거 → 본 함수
// 동작:  확정 상태 신청자에게 예약확정 이메일(베트남어) 발송 → 결과를 applications 에 기록
//        (confirm_mail = 'sent' | 'failed', confirm_mail_at, confirm_mail_err)
//
// ⚠️ 고객 임의 이메일로 보내려면 Resend 도메인 인증 + FROM_EMAIL 을 그 도메인 주소로 설정해야 함.
//
// 필요한 시크릿 (supabase secrets set):
//   RESEND_API_KEY, FROM_EMAIL(도메인 인증 주소 권장), WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  ← 자동 주입
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL   = Deno.env.get("FROM_EMAIL") || "LIMINAL SPACE <onboarding@resend.dev>";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function className(id: string | null, lang: string): Promise<string> {
  if (!id) return "";
  const { data } = await db.from("classes").select("name_ko,name_en,name_vi").eq("id", id).single();
  if (!data) return "";
  return lang === "ko" ? (data.name_ko || data.name_vi || data.name_en || "")
       : lang === "en" ? (data.name_en || data.name_vi || data.name_ko || "")
       :                 (data.name_vi || data.name_en || data.name_ko || "");
}
async function branchName(id: string | null, lang: string): Promise<string> {
  if (!id) return "";
  const { data } = await db.from("branches").select("name,name_en,name_vi").eq("id", id).single();
  if (!data) return "";
  return lang === "en" ? (data.name_en || data.name || "")
       : lang === "vi" ? (data.name_vi || data.name || "")
       :                 (data.name || "");
}
function esc(s: unknown){ return String(s ?? "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]!)); }
function row(k: string, v: unknown){ return v ? `<tr><td style="padding:7px 12px;color:#888;white-space:nowrap">${k}</td><td style="padding:7px 12px;font-weight:600">${esc(v)}</td></tr>` : ""; }

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET)
    return new Response("forbidden", { status: 403 });

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const a = payload?.record;
  if (!a) return new Response("ignored", { status: 200 });

  // 어드민 알림관리에서 '예약자 확정메일'이 꺼져 있으면 스킵
  const { data: si } = await db.from("site_info").select("confirm_mail_on").eq("id", "main").single();
  if (si?.confirm_mail_on !== true)
    return new Response(JSON.stringify({ skipped: "off" }), { status: 200, headers: { "Content-Type": "application/json" } });

  // 확정 상태 + 이메일 있을 때만
  if (a.status !== "confirmed" || !a.email)
    return new Response(JSON.stringify({ skipped: "not-confirmed-or-no-email" }), { status: 200, headers: { "Content-Type": "application/json" } });

  // 신청 당시 언어에 맞춰 발송 (기본 vi)
  const lang = (a.lang === "ko" || a.lang === "en" || a.lang === "vi") ? a.lang : "vi";
  const L: Record<string, Record<string, string>> = {
    ko: { subject:"[LIMINAL SPACE] 예약이 확정되었습니다", intro:"LIMINAL SPACE 향수 클래스 신청이 확정되었습니다. 예약 정보는 다음과 같습니다:", cls:"클래스", branch:"지점", date:"날짜", time:"시간", people:"인원", closing:"공방에서 뵙겠습니다. 변경이 필요하시면 저희에게 연락 부탁드립니다.", auto:"이 메일은 예약이 확정될 때 자동 발송됩니다." },
    en: { subject:"[LIMINAL SPACE] Your booking is confirmed", intro:"Your perfume class booking at LIMINAL SPACE has been confirmed. Here are the details:", cls:"Class", branch:"Branch", date:"Date", time:"Time", people:"People", closing:"See you at the studio. Please contact us if you need any changes.", auto:"This email is sent automatically when your booking is confirmed." },
    vi: { subject:"[LIMINAL SPACE] Xác nhận đăng ký lớp học nước hoa", intro:"Cảm ơn bạn đã đăng ký lớp học nước hoa tại LIMINAL SPACE. Đơn đăng ký của bạn đã được xác nhận với thông tin như sau:", cls:"Lớp học", branch:"Chi nhánh", date:"Ngày", time:"Giờ", people:"Số người", closing:"Hẹn gặp bạn tại xưởng. Nếu bạn cần thay đổi lịch hẹn, vui lòng liên hệ với chúng tôi.", auto:"Email này được gửi tự động khi đơn đăng ký được xác nhận." },
  };
  const t = L[lang];
  const cls    = await className(a.class_id, lang);
  const branch = await branchName(a.branch_id, lang);
  const greeting = lang === "ko" ? `${esc(a.name)}님, 안녕하세요.` : (lang === "en" ? `Hello ${esc(a.name)},` : `Xin chào ${esc(a.name)},`);

  const subject = t.subject;
  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#16171a">
    <h2 style="letter-spacing:.08em;margin:0 0 4px">LIMINAL SPACE</h2>
    <p style="color:#7a7c82;font-size:12px;margin:0 0 18px">10° 47' 27.49" N 106° 41' 36.89" E</p>
    <p>${greeting}</p>
    <p>${t.intro}</p>
    <table style="border-collapse:collapse;font-size:14px;border:1px solid #eee;width:100%;margin-top:6px">
      ${row(t.cls, cls)}
      ${row(t.branch, branch)}
      ${row(t.date, a.want_date)}
      ${row(t.time, a.want_time)}
      ${row(t.people, a.people)}
    </table>
    <p style="margin-top:16px">${t.closing}</p>
    <p style="color:#aaa;font-size:12px;margin-top:14px">${t.auto}</p>
  </div>`;

  let ok = false, errMsg = "";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: [a.email], subject, html }),
    });
    const j = await r.json().catch(() => ({}));
    ok = r.ok && !j.error;
    if (!ok) errMsg = JSON.stringify(j).slice(0, 400);
  } catch (e) {
    ok = false; errMsg = String(e).slice(0, 400);
  }

  // 결과 기록
  await db.from("applications").update({
    confirm_mail: ok ? "sent" : "failed",
    confirm_mail_at: new Date().toISOString(),
    confirm_mail_err: ok ? null : errMsg,
  }).eq("id", a.id);

  return new Response(JSON.stringify({ ok, err: errMsg }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
