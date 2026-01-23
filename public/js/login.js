// public/js/login.js
(function () {
  const sb = window.sb || window.supabaseClient;
  if (!sb) {
    console.error("Supabase client belum siap. Cek js/supabaseClient.js");
    return;
  }

  const q = (sel) => document.querySelector(sel);
  const qa = (sel) => Array.from(document.querySelectorAll(sel));

  function getTranslation() {
    // login.html punya translations + currentLanguage
    try {
      const lang = window.currentLanguage || "id";
      const t = (window.translations && window.translations[lang]) || null;
      return { lang, t };
    } catch {
      return { lang: "id", t: null };
    }
  }

  function toast(msg) {
    // simple toast
    let el = document.getElementById("authToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "authToast";
      el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:12px 16px;border-radius:12px;font:600 13px/1.2 Poppins,system-ui;z-index:9999;max-width:min(520px, calc(100vw - 32px));text-align:center;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.display = "none"), 2200);
  }

  async function postLoginRedirect() {
    // check approved
    const { data: userRes } = await sb.auth.getUser();
    const user = userRes?.user;
    if (!user) return;

    const { data: profile } = await sb
      .from("profiles")
      .select("approved")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.approved) location.href = "./app.html";
    else location.href = "./pending.html";
  }

  async function handleLogin(email, password, btn) {
    try {
      btn && (btn.disabled = true);
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await postLoginRedirect();
    } catch (e) {
      toast(e?.message || "Login gagal");
    } finally {
      btn && (btn.disabled = false);
    }
  }

  async function handleSignup(fullname, email, username, password, btn) {
    try {
      btn && (btn.disabled = true);
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { fullname, username },
        },
      });
      if (error) throw error;

      // Supabase trigger akan bikin row profiles. Tapi kadang user belum confirmed.
      // Kalau email confirmation OFF, user langsung bisa login tapi tetap pending approve.
      toast("✅ Daftar berhasil. Menunggu approval admin…");
      // auto redirect jika session langsung ada
      const { data: sess } = await sb.auth.getSession();
      if (sess?.session) location.href = "./pending.html";
    } catch (e) {
      toast(e?.message || "Daftar gagal");
    } finally {
      btn && (btn.disabled = false);
    }
  }

  async function handleForgot(email, btn) {
    try {
      btn && (btn.disabled = true);
      // redirectTo harus sesuai domain cloudflare kamu
      const redirectTo = location.origin + "/login.html";
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast("✅ Link reset terkirim (cek inbox/spam)");
    } catch (e) {
      toast(e?.message || "Gagal kirim link reset");
    } finally {
      btn && (btn.disabled = false);
    }
  }

  // Desktop login form
  const desktopForm = q("#login-form");
  desktopForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (q("#username-desktop")?.value || "").trim();
    const pass = (q("#password-desktop")?.value || "").trim();
    const btn = q("#login-btn");
    handleLogin(email, pass, btn);
  });

  // Mobile login form
  const mobileForm = q("#login-form-mobile");
  mobileForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (q("#username-mobile")?.value || "").trim();
    const pass = (q("#password-mobile")?.value || "").trim();
    const btn = q("#login-btn-mobile");
    handleLogin(email, pass, btn);
  });

  // Signup modal form
  const signupForm = q("#signup-form");
  signupForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullname = (q("#signup-fullname")?.value || "").trim();
    const email = (q("#signup-email")?.value || "").trim();
    const username = (q("#signup-username")?.value || "").trim();
    const pass = (q("#signup-password")?.value || "").trim();
    const btn = q("#signup-btn");
    handleSignup(fullname, email, username, pass, btn);
  });

  // Forgot modal form
  const forgotForm = q("#forgot-form");
  forgotForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (q("#forgot-email")?.value || "").trim();
    const btn = q("#forgot-btn");
    handleForgot(email, btn);
  });

  // If already logged in, redirect
  (async function () {
    const { data: sess } = await sb.auth.getSession();
    if (sess?.session) await postLoginRedirect();
  })();
})();
