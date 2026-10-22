/**
 * Paradox · shared UI bootstrap
 * Loads profile into the top bar. When signed out, the top-right coin pill
 * becomes a "Sign in" button that goes to login.html.
 * Requires supabase-client.js to be loaded first.
 */
(async function () {
  const link = document.getElementById('coins-link');
  let session = null;

  if (window.Paradox && window.Paradox.refreshTopbar) {
    try {
      session = await window.Paradox.getSession();
      await window.Paradox.refreshTopbar();
    } catch (e) { /* treat as signed out */ }
  } else {
    // Fallback while Supabase is not configured
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set('user-name', 'Guest');
    set('user-handle', '@guest');
  }

  if (link && !session) {
    link.href = link.dataset.login || 'pages/login.html';
    link.removeAttribute('title');
    link.classList.add('signin');
    link.textContent = 'Sign in';
  }

  if (window.lucide) lucide.createIcons();
  if (link) link.style.visibility = 'visible';
})();
