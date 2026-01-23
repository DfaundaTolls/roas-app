// public/js/app.js
(async function () {
  const sb = window.sb || window.supabaseClient;
  if (!sb) return (location.href = "./login.html");

  // protect page
  if (typeof window.requireApprovedUser === "function") {
    await window.requireApprovedUser({ redirectTo: "./login.html", pendingTo: "./pending.html" });
  }

  // pull user + show in settings
  try {
    const { data: userRes } = await sb.auth.getUser();
    const user = userRes?.user;
    if (user) {
      window.currentUser = window.currentUser || {};
      window.currentUser.email = user.email;
      window.currentUser.name = user.user_metadata?.fullname || user.user_metadata?.username || "Pengguna";
      if (typeof window.updateUserSection === "function") window.updateUserSection();
    }
  } catch (e) {
    // ignore
  }

  // override logout handler to real signOut
  window.handleLogout = async function () {
    try { await sb.auth.signOut(); } catch {}
    location.href = "./login.html";
  };
})();
