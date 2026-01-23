// roas-app/public/js/pending.js
(function () {
  const sb = window.sb || window.supabaseClient;
  if (!sb) {
    console.error("Supabase client belum siap");
    return;
  }

  const emailEl = document.getElementById("userEmail");
  const idEl = document.getElementById("userId");
  const overlay = document.getElementById("loadingOverlay");
  const statusText = document.getElementById("statusText");

  function setLoading(on) {
    if (!overlay) return;
    overlay.classList.toggle("hidden", !on);
  }

  async function getMe() {
    const { data: userRes } = await sb.auth.getUser();
    return userRes?.user || null;
  }

  async function checkApproval() {
    const user = await getMe();
    if (!user) {
      location.href = "./login.html";
      return;
    }

    if (emailEl) emailEl.textContent = user.email || "-";
    if (idEl) idEl.textContent = user.id || "-";

    const { data: profile, error } = await sb
      .from("profiles")
      .select("approved")
      .eq("id", user.id)
      .maybeSingle();

    if (error) console.warn(error);

    if (profile?.approved) {
      if (statusText) statusText.textContent = "ACTIVE";
      location.href = "./app.html";
      return;
    }

    if (statusText) statusText.textContent = "PENDING";
  }

  // Logout fallback
  window.handleLogout = async function () {
    await sb.auth.signOut();
    location.href = "./login.html";
  };

  // ===== WhatsApp contact button (SELALU override) =====
  const ADMIN_WA = "6285194268317"; // +62 851-9426-8317

  function buildApproveLink(userId) {
    return `https://roas-app.pages.dev/admin.html?uid=${encodeURIComponent(userId)}`;
  }

  function buildWhatsAppMessage(email, userId) {
    const approveLink = buildApproveLink(userId);
    return (
      `Halo admin, saya sudah daftar. Mohon bantu aktivasi akun saya.\n\n` +
      `Email: ${email}\n` +
      `User ID: ${userId}\n\n` +
      `Klik link ini untuk approve dari HP:\n` +
      `${approveLink}\n\n` +
      `PIN admin: 313131`
    );
  }

  // OVERRIDE selalu, biar ga kepake versi lama dari pending.html
  window.contactAdmin = async function () {
    const user = await getMe();
    const email = user?.email || "-";
    const id = user?.id || "-";

    const msg = encodeURIComponent(buildWhatsAppMessage(email, id));
    window.open(`https://wa.me/${ADMIN_WA}?text=${msg}`, "_blank");
  };

  (async function boot() {
    setLoading(true);
    try {
      await checkApproval();
    } finally {
      setLoading(false);
    }
    setInterval(checkApproval, 5000);
  })();
})();
