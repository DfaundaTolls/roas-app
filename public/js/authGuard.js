// public/js/authGuard.js
// Small helper to protect pages.
// Usage: await requireApprovedUser({ redirectTo: "./login.html", pendingTo: "./pending.html" })

async function getProfile(sb) {
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error } = await sb
    .from("profiles")
    .select("id, email, approved, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.warn("profile fetch error", error);
  return { user, profile: profile || null };
}

async function requireSignedIn({ redirectTo = "./login.html" } = {}) {
  const sb = window.sb || window.supabaseClient;
  if (!sb) return (location.href = redirectTo);

  const { data: sess } = await sb.auth.getSession();
  if (!sess?.session) location.href = redirectTo;
}

async function requireApprovedUser({ redirectTo = "./login.html", pendingTo = "./pending.html" } = {}) {
  const sb = window.sb || window.supabaseClient;
  if (!sb) return (location.href = redirectTo);

  const { data: sess } = await sb.auth.getSession();
  if (!sess?.session) return (location.href = redirectTo);

  const { profile } = await getProfile(sb);
  if (!profile) return (location.href = pendingTo);

  if (!profile.approved) return (location.href = pendingTo);
}

async function requireAdmin({ redirectTo = "./login.html" } = {}) {
  const sb = window.sb || window.supabaseClient;
  if (!sb) return (location.href = redirectTo);

  const { data: sess } = await sb.auth.getSession();
  if (!sess?.session) return (location.href = redirectTo);

  const { profile } = await getProfile(sb);
  if (!profile || profile.role !== "admin") return (location.href = redirectTo);
}
