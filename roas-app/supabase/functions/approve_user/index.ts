// supabase/functions/approve_user/index.ts
// Deno runtime (Supabase Edge Functions)
//
// POST { user_id: string, pin: string }
//
// Approve user by setting profiles.approved=true.
// This uses SERVICE_ROLE key on server side (safe).
//
// Configure secrets:
// supabase secrets set ADMIN_PIN=xxxx SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
//
// Deploy:
// supabase functions deploy approve_user
// supabase secrets set --env-file .env

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const user_id = String(payload.user_id || "").trim();
  const pin = String(payload.pin || "").trim();
  if (!user_id) return json(400, { error: "user_id wajib" });
  if (!pin) return json(400, { error: "pin wajib" });

  const ADMIN_PIN = Deno.env.get("ADMIN_PIN") || "";
  if (!ADMIN_PIN) return json(500, { error: "ADMIN_PIN belum diset di secrets" });
  if (pin !== ADMIN_PIN) return json(401, { error: "PIN salah" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(500, { error: "SUPABASE_URL / SERVICE_ROLE belum diset" });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await sb
    .from("profiles")
    .update({ approved: true })
    .eq("id", user_id);

  if (error) return json(500, { error: error.message });

  return json(200, { ok: true });
});
