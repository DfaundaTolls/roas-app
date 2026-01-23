// public/js/supabaseClient.js
// 1) Buat project di Supabase, lalu isi 2 value ini.
// 2) Pastikan site domain Cloudflare Pages kamu masuk ke Supabase Auth > URL Configuration (Site URL + Redirect URLs).

// TODO: ganti dengan milik kamu
window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// (Optional) Admin PIN untuk Edge Function approve_user.
// Jangan taruh pin rahasia di frontend untuk production beneran.
// Ini sesuai flow kamu: admin approve via halaman admin.html + PIN.
window.ADMIN_PIN = "123456"; // ganti

(function initSupabase() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  // Support: jika pending.html sudah load supabase-js@2 via CDN
  if (window.supabase && typeof window.supabase.createClient === "function") {
    window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    // back-compat for scripts that look for window.supabaseClient
    window.supabaseClient = window.sb;
    return;
  }

  console.warn("Supabase JS belum ke-load. Tambahkan: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
})();
