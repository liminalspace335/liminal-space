// ============================================================
// LIMINAL SPACE — 어드민 계정 생성/삭제/권한부여 (마스터 계정 전용)
// ------------------------------------------------------------
// 브라우저(어드민 패널 "계정관리")에서 client.functions.invoke('admin-manage', {body}) 로 호출.
// service_role 키는 이 서버(Edge Function) 안에서만 사용하고 브라우저에는 절대 내려가지 않음.
// 호출자가 실제로 public.admin_accounts.is_master = true 인 계정인지 여기서 다시 검증한다
// (화면에서 메뉴를 숨기는 것과 별개로, 계정 생성/삭제 권한은 서버에서 강제한다).
//
// body: { action:'create'|'updatePerms'|'remove', email, password?, label?, perms? }
// 필요한 시크릿: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (Edge 런타임이 자동 주입)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// 호출자의 access_token으로 신원 확인 → admin_accounts.is_master 재검증(서버 측 강제)
async function requireMaster(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data?.user?.email) return null;
  const email = data.user.email;
  const { data: row } = await admin.from("admin_accounts").select("is_master").eq("email", email).maybeSingle();
  return row?.is_master ? email : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const callerEmail = await requireMaster(req.headers.get("Authorization"));
    if (!callerEmail) return json({ error: "마스터 계정만 사용할 수 있습니다." }, 403);

    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      if (!email || !password) return json({ error: "이메일/비밀번호가 필요합니다." }, 400);
      if (password.length < 8) return json({ error: "비밀번호는 8자 이상이어야 합니다." }, 400);
      const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (cErr) return json({ error: cErr.message }, 400);
      const { error: iErr } = await admin.from("admin_accounts")
        .upsert({ email, label: body.label || "", perms: body.perms || {}, is_master: false });
      if (iErr) return json({ error: iErr.message }, 400);
      return json({ ok: true, user_id: created.user?.id });
    }

    if (action === "updatePerms") {
      const email = String(body.email || "").trim();
      if (!email) return json({ error: "이메일이 필요합니다." }, 400);
      const { data: row } = await admin.from("admin_accounts").select("is_master").eq("email", email).maybeSingle();
      if (row?.is_master) return json({ error: "마스터 계정의 권한은 여기서 바꿀 수 없습니다." }, 400);
      const { error } = await admin.from("admin_accounts")
        .update({ label: body.label ?? "", perms: body.perms || {} }).eq("email", email);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "remove") {
      const email = String(body.email || "").trim();
      if (!email) return json({ error: "이메일이 필요합니다." }, 400);
      if (email === callerEmail) return json({ error: "본인 계정은 삭제할 수 없습니다." }, 400);
      const { data: row } = await admin.from("admin_accounts").select("is_master").eq("email", email).maybeSingle();
      if (row?.is_master) return json({ error: "마스터 계정은 삭제할 수 없습니다." }, 400);
      const { data: list, error: lErr } = await admin.auth.admin.listUsers();
      if (lErr) return json({ error: lErr.message }, 400);
      const target = list?.users?.find((u) => u.email === email);
      if (target) {
        const { error: dErr } = await admin.auth.admin.deleteUser(target.id);
        if (dErr) return json({ error: dErr.message }, 400);
      }
      await admin.from("admin_accounts").delete().eq("email", email);
      return json({ ok: true });
    }

    return json({ error: "알 수 없는 action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 400);
  }
});
