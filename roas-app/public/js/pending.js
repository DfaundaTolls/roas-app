// public/js/pending.js
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
      // redirect
      location.href = "./app.html";
      return;
    }

    if (statusText) statusText.textContent = "PENDING";
  }

  // Logout button in pending.html already calls handleLogout, but we provide fallback
  if (typeof window.handleLogout !== "function") {
    window.handleLogout = async function () {
      await sb.auth.signOut();
      location.href = "./login.html";
    };
  }

  // WhatsApp contact button
  if (typeof window.contactAdmin !== "function") {
    window.contactAdmin = async function () {
      const user = await getMe();
      const email = user?.email || "-";
      const id = user?.id || "-";
      // number is configured in pending.html fallback script if exists; else use placeholder
      const num = "6280000000000";
      const msg = encodeURIComponent(
        `Halo admin, saya sudah daftar. Mohon bantu aktivasi akun saya.\n\nEmail: ${email}\nUser ID: ${id}`
      );
      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
    };
  }

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
