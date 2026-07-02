// ============================================================
// LIMINAL SPACE — 신청 접수 시 이메일 알림 (Supabase Edge Function + Resend)
// ------------------------------------------------------------
// 트리거: applications 테이블 INSERT (Supabase Database Webhook)
// 동작:  웹훅 수신 → 지점/클래스명 조회 → 신청 요약 이메일 발송(Resend)
//
// 받는 이메일·알림 on/off 는 어드민(환경설정 › 사이트정보)에서 관리 → site_info 테이블에서 읽음.
//
// 필요한 시크릿 (supabase secrets set 으로 등록, 코드에 직접 넣지 말 것):
//   RESEND_API_KEY   Resend API 키
//   FROM_EMAIL       (선택) 발신 주소. 기본값 onboarding@resend.dev (도메인 인증 전 테스트용)
//   WEBHOOK_SECRET   (선택) 웹훅 위변조 방지용 공유 비밀값
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  ← Edge 런타임이 자동 주입
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL   = Deno.env.get("FROM_EMAIL") || "LIMINAL SPACE <onboarding@resend.dev>";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const STATUS_KO: Record<string,string> = {
  new:"신규", confirmed:"확정", done:"완료", cancel:"취소", refund:"환불", refund_deposit:"환불(예약금)"
};

async function branchName(id: string | null): Promise<string> {
  if (!id) return "";
  const { data } = await db.from("branches").select("name").eq("id", id).single();
  return data?.name || "";
}
// 클래스명 + 문의전용 여부를 함께 조회 (classes 테이블은 name_ko/name_en/name_vi 컬럼 사용)
async function classInfo(id: string | null): Promise<{ name: string; inquiry: boolean }> {
  if (!id) return { name: "", inquiry: false };
  const { data } = await db.from("classes").select("name_ko,name_en,name_vi,inquiry_only").eq("id", id).single();
  return { name: data?.name_ko || data?.name_en || data?.name_vi || "", inquiry: data?.inquiry_only === true };
}
// 메모가 문의 템플릿으로 시작하면 문의로 간주 (class 매칭 실패 대비 안전장치)
function looksLikeInquiry(msg: unknown): boolean {
  return /^\s*\[(문의\s*내용|Inquiry|Liên hệ)\]/.test(String(msg ?? ""));
}
function esc(s: unknown){ return String(s ?? "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]!)); }
function row(k: string, v: unknown){ return v ? `<tr><td style="padding:6px 12px;color:#888;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px;font-weight:600">${esc(v)}</td></tr>` : ""; }
// 메모 등 줄바꿈 보존(HTML 이메일에서 \n 이 무시되는 문제 해결)
function rowMulti(k: string, v: unknown){ const t=String(v ?? "").trim(); return t ? `<tr><td style="padding:6px 12px;color:#888;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 12px;font-weight:600;line-height:1.55">${esc(t).replace(/\n/g,"<br>")}</td></tr>` : ""; }

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET)
    return new Response("forbidden", { status: 403 });

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const a = payload?.record;
  if (payload?.type !== "INSERT" || !a) return new Response("ignored", { status: 200 });

  // 받는 이메일·알림 사용여부는 어드민 설정(site_info)에서 읽음
  const { data: si } = await db.from("site_info").select("notify_email,notify_on").eq("id", "main").single();
  const NOTIFY_EMAIL = (si?.notify_email || "").trim();
  const NOTIFY_ON = si?.notify_on !== false;
  if (!RESEND_KEY || !NOTIFY_EMAIL || !NOTIFY_ON)
    return new Response(JSON.stringify({ skipped: true, reason: !NOTIFY_ON ? "off" : (!NOTIFY_EMAIL ? "no-email" : "no-key") }), { status: 200 });

  const branch = await branchName(a.branch_id);
  const ci     = await classInfo(a.class_id);
  const cls    = ci.name;
  const inq    = ci.inquiry || looksLikeInquiry(a.msg);   // 문의전용 클래스 여부(+메모 기반 보조 판별)
  const kind   = inq ? "문의" : "신청";

  const subject = `[${kind}] ${a.name || "이름없음"} · ${branch || ""} ${a.want_date || ""} ${inq ? "" : (a.want_time || "")}`.trim();
  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto">
    <h2 style="letter-spacing:.08em">LIMINAL SPACE — 새 ${kind}</h2>
    <table style="border-collapse:collapse;font-size:14px;border:1px solid #eee;width:100%">
      ${row("구분", inq ? "문의 (예약 아님)" : "클래스 신청")}
      ${row("희망일", a.want_date)}${inq ? "" : row("시간", a.want_time)}
      ${row("이름", a.name)}${row("연락처", a.phone)}
      ${row("지점", branch)}${row("클래스", cls)}
      ${inq ? "" : row("용량", a.size)}${inq ? "" : row("인원", a.people)}${row("국적", a.nationality)}
      ${inq ? "" : row("결제예정", a.amount)}${row("이메일", a.email)}
      ${row("Facebook", a.sns_facebook)}${row("Instagram", a.sns_instagram)}
      ${rowMulti(inq ? "문의 내용" : "메모", a.msg)}
      ${row("상태", STATUS_KO[a.status] || a.status)}
      ${row("신청시각", a.created_at)}
    </table>
    <p style="color:#aaa;font-size:12px;margin-top:14px">이 메일은 ${kind} 접수 시 자동 발송됩니다.</p>
  </div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL.split(",").map(s => s.trim()).filter(Boolean),
      subject,
      html,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return new Response(JSON.stringify({ ok: r.ok, resend: j }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
