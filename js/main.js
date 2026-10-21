/**
 * Paradox · shared UI bootstrap
 * Loads profile into the top bar (falls back to Guest when not signed in).
 * Requires supabase-client.js to be loaded first.
 */
(async function () {
  if (window.Paradox && window.Paradox.refreshTopbar) {
    await window.Paradox.refreshTopbar();
  } else {
    // Fallback while Supabase is not configured
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set('user-name', 'Guest');
    set('user-handle', '@guest');
    set('coin-count', '0');
  }

  if (window.lucide) lucide.createIcons();
})();
