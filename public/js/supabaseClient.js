// public/js/supabaseClient.js
// 1) Pastikan domain Cloudflare Pages kamu masuk ke Supabase:
//    Authentication → URL Configuration → Site URL + Redirect URLs

window.SUPABASE_URL = "https://oqvrkoxrnkwtojiggelc.supabase.co";
window.SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdnJrb3hybmt3dG9qaWdnZWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODU1NzgsImV4cCI6MjA4NDc2MTU3OH0.QASVCj2le4iVGULonmsNL8KxxD8GupLJlVbhSM15yYI";

// Admin PIN harus sama persis dengan yang kamu set di Supabase secrets:
// supabase secrets set ADMIN_PIN="...."
window.ADMIN_PIN = "313131";

(function initSupabase() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL / SUPABASE_ANON_KEY belum diisi.");
    return;
  }

  // pastikan supabase-js v2 sudah keload via CDN di HTML
  if (window.supabase && typeof window.supabase.createClient === "function") {
    window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    // alias biar script lain tetap jalan
    window.supabaseClient = window.sb;
    return;
  }

  console.error(
    "Supabase JS belum ke-load. Pastikan ada script ini di HTML:\n" +
      '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
  );
})();
