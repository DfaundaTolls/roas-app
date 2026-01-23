// roas-app/public/js/admin.js
// Admin approval via Supabase Edge Function: approve_user
// Requirement:
// - window.SUPABASE_URL, window.SUPABASE_ANON_KEY, window.ADMIN_PIN tersedia (dari supabaseClient.js)
// - Edge Function approve_user sudah deploy
// - Secret ADMIN_PIN sudah diset di Supabase

(function () {
  const $ = (id) => document.getElementById(id);

  const userIdEl = $("userId");
  const pinEl = $("pin");
  const approveBtn = $("approveBtn");
  const msgEl = $("msg");
  const btnTextEl = $("buttonText");

  function setMsg(text, type = "info") {
    if (!msgEl) return;
    msgEl.textContent = text;

    // Reset classes (biar rapi)
    msgEl.classList.remove("hidden");
    msgEl.classList.remove("text-red-600", "text-green-600", "text-slate-600");

    if (type === "error") msgEl.classList.add("text-red-600");
    else if (type === "success") msgEl.classList.add("text-green-600");
    else msgEl.classList.add("text-slate-600");
  }

  function getQueryParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch {
      return null;
    }
  }

  function setLoading(isLoading) {
    if (!approveBtn) return;
    approveBtn.disabled = isLoading;
    if (btnTextEl) btnTextEl.textContent = isLoading ? "Memproses..." : "Approve (Aktifkan)";
  }

  // Prefill user id dari query param (uid/user_id)
  const uid = getQueryParam("uid") || getQueryParam("user_id");
  if (uid && userIdEl && !userIdEl.value) userIdEl.value = uid;

  // Prefill pin dari localStorage / config
  try {
    const savedPin = localStorage.getItem("ADMIN_PIN") || "";
    if (pinEl && savedPin && !pinEl.value) pinEl.value = savedPin;
    if (pinEl && !pinEl.value && window.ADMIN_PIN && window.ADMIN_PIN !== "123456") {
      pinEl.value = window.ADMIN_PIN;
    }
  } catch {}

  async function approve() {
    // Validasi config supabase
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      setMsg("Config Supabase belum diisi. Cek supabaseClient.js", "error");
      return;
    }

    const userId = (userIdEl?.value || "").trim();
    const adminPin = (pinEl?.value || "").trim();

    if (!userId) return setMsg("User ID wajib diisi.", "error");
    if (!adminPin) return setMsg("Admin PIN wajib diisi.", "error");

    // Simpan pin biar next tinggal klik
    try {
      localStorage.setItem("ADMIN_PIN", adminPin);
    } catch {}

    setLoading(true);
    setMsg("Menghubungi server...", "info");

    const url = `${window.SUPABASE_URL}/functions/v1/approve_user`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // WAJIB: Edge Function butuh auth header
          "Authorization": `Bearer ${window.SUPABASE_ANON_KEY}`,
          "apikey": window.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_id: userId, pin: adminPin }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = { message: await res.text() };
      }

      if (!res.ok) {
        const errMsg =
          data?.message ||
          data?.error ||
          `Gagal approve. HTTP ${res.status}`;
        setMsg(errMsg, "error");
        setLoading(false);
        return;
      }

      setMsg("Sukses! User sudah di-approve. User akan otomatis masuk aplikasi dari pending.", "success");
      setLoading(false);

      // Optional: redirect balik ke pending (biar admin bisa cek)
      // setTimeout(() => (window.location.href = "/pending.html"), 1200);
    } catch (e) {
      setMsg(`Gagal konek ke function: ${e?.message || e}`, "error");
      setLoading(false);
    }
  }

  if (approveBtn) approveBtn.addEventListener("click", approve);
})();
