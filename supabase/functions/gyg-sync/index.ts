// ============================================================
// LIMINAL SPACE — 플랫폼(GetYourGuide·KKday) 예약 → 홈페이지 신청 자동 반영 (Supabase Edge Function)
// (이름은 처음 만든 GYG 기준 gyg-sync 그대로 — Apps Script가 이 주소를 쓰고 있음)
// ------------------------------------------------------------
// 호출: 사업용 Gmail의 Apps Script(scripts/gyg-gmail-sync.gs)가 GYG 예약/취소 메일을 읽어 POST.
// body: { source:'gyg'|'kkday'(기본 gyg), action:'book'|'cancel', ref, date:'YYYY-MM-DD', time:'HH:MM', people, size:'30ml',
//         name, phone, language, price, dryRun }
//   book   → applications 에 source='gyg', ext_ref=ref 로 확정 신청 추가 (같은 ref는 한 번만)
//   cancel → 같은 ref 신청의 상태를 'cancel' 로 변경 (행은 지우지 않음)
//   dryRun → DB에 쓰지 않고 "이렇게 넣을 예정"만 돌려줌
//
// 손님 전화번호는 phone 칸이 아니라 메모(msg)에 넣는다 — phone 칸에 넣으면 INSERT 트리거가
// 잘로 ZNS를 GYG 손님에게 실제로 발송하기 때문(잘로 연동은 건드리지 않는다). email도 비워서 확정메일 발송 안 됨.
// 정원 초과여도 GYG 예약은 이미 확정이라 막지 않고, 메모 앞에 경고를 붙인다.
//
// 시크릿: GYG_SYNC_SECRET (Apps Script와 같은 값) — x-sync-secret 헤더로 검증
//         SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Edge 런타임이 자동 주입
// 배포: supabase functions deploy gyg-sync --no-verify-jwt  (인증은 위 시크릿으로)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET = Deno.env.get("GYG_SYNC_SECRET") || "";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// GYG 상품은 호치민 지점의 Signature Scent Workshop 하나로 판매 중
const BRANCH_ID = "br_mqt85rqtqlmbfk";
const CLASS_ID = "cl_mqj89f9wfi7bet";
// 플랫폼별 예약번호 형식 + 메모 표시명. source 값은 어드민 출처 칸(SOURCE)과 같아야 함
const PLATFORMS: Record<string, { re: RegExp; label: string }> = {
  gyg: { re: /^GYG[A-Z0-9]{6,}$/, label: "GYG" },
  kkday: { re: /^\d{2}KK\d{6,}$/, label: "KKday" },   // 예: 26KK221534633
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const safeInt = (v: unknown) => (/^[0-9]+$/.test(String(v ?? "")) ? Number(v) : 1);

async function slotStatus(date: string, time: string) {
  const { data: s } = await db.from("schedule_slots").select("cap")
    .eq("branch_id", BRANCH_ID).eq("sched_date", date).eq("time", time).eq("class_id", CLASS_ID).limit(1);
  let cap: number | null = s?.[0]?.cap ?? null;
  if (cap == null) {
    const { data: d } = await db.from("default_slots").select("cap")
      .eq("branch_id", BRANCH_ID).eq("time", time).eq("class_id", CLASS_ID).limit(1);
    cap = d?.[0]?.cap ?? null;
  }
  const { data: apps } = await db.from("applications").select("people")
    .eq("branch_id", BRANCH_ID).eq("want_date", date).eq("want_time", time).eq("class_id", CLASS_ID)
    .neq("status", "cancel");
  const booked = (apps || []).reduce((n, a) => n + safeInt(a.people), 0);
  return { cap, booked };
}

Deno.serve(async (req) => {
  if (!SECRET || req.headers.get("x-sync-secret") !== SECRET) return json({ error: "forbidden" }, 403);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }

  const SOURCE = String(b.source || "gyg");
  const pf = PLATFORMS[SOURCE];
  if (!pf) return json({ error: "bad source", source: SOURCE }, 400);
  const ref = String(b.ref || "").trim();
  if (!pf.re.test(ref)) return json({ error: "bad ref", ref }, 400);

  const { data: existing } = await db.from("applications").select("id,status")
    .eq("source", SOURCE).eq("ext_ref", ref).limit(1);
  const found = existing?.[0];

  if (b.action === "cancel") {
    if (!found) return json({ ok: true, result: "not_found", ref });
    if (found.status === "cancel") return json({ ok: true, result: "already_cancelled", ref });
    if (b.dryRun) return json({ ok: true, dryRun: true, result: "would_cancel", id: found.id, ref });
    const { error } = await db.from("applications").update({ status: "cancel" }).eq("id", found.id);
    return error ? json({ error: error.message }, 500) : json({ ok: true, result: "cancelled", id: found.id, ref });
  }

  if (b.action !== "book") return json({ error: "bad action" }, 400);
  if (found) return json({ ok: true, result: "exists", id: found.id, ref });

  const date = String(b.date || ""), time = String(b.time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return json({ error: "bad date/time", date, time }, 400);
  const people = Math.max(1, safeInt(b.people));
  const size = /^\d+ml$/.test(String(b.size || "")) ? String(b.size) : "";

  const { cap, booked } = await slotStatus(date, time);
  const over = cap != null && booked + people > cap;
  const memo = [
    over ? `⚠️ 정원 초과(기존 ${booked}명 + ${people}명 / 정원 ${cap}명)` : "",
    cap == null ? "⚠️ 홈페이지에 없는 시간대" : "",
    `[${pf.label}] 예약번호 ${ref}`,
    b.phone ? `연락처 ${b.phone}` : "",
    b.language ? `언어 ${b.language}` : "",
  ].filter(Boolean).join(" · ");

  const row = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    branch_id: BRANCH_ID, class_id: CLASS_ID, size,
    want_date: date, want_time: time, people: String(people),
    name: String(b.name || "").slice(0, 100), phone: "", email: "",
    nationality: "", msg: memo,
    amount: b.price ? `${b.price}₫` : "", deposit: "",
    status: "confirmed", source: SOURCE, ext_ref: ref,
  };
  if (b.dryRun) return json({ ok: true, dryRun: true, result: "would_insert", row, cap, booked });

  const { error } = await db.from("applications").insert(row);
  if (error) {
    if (error.code === "23505") return json({ ok: true, result: "exists", ref });   // 동시 처리로 같은 ref가 먼저 들어간 경우
    return json({ error: error.message }, 500);
  }
  return json({ ok: true, result: "inserted", id: row.id, ref, over });
});
