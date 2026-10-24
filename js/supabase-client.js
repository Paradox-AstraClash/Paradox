/**
 * Paradox · Supabase client + helpers
 * --------------------------------------------------
 * 1. Create a project at https://supabase.com
 * 2. Paste your Project URL + anon key below
 * 3. Run supabase/schema.sql in the SQL Editor
 * 4. Include this file on every page that needs auth/data
 */

const SUPABASE_URL = 'https://vghxiupmcfvoidxmeenp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaHhpdXBtY2Z2b2lkeG1lZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDU3NzEsImV4cCI6MjEwODEyMTc3MX0.CeRCIeqpMTw21wtF-nJqug0fkyZv2Rdl4L-dQUmWg5A';

// Load the library if it isn't already present
if (!window.supabase) {
  console.error('Supabase JS not loaded. Add the CDN script before this file.');
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------
// Auth helpers
// ------------------------------------------------------------
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/** Internal email used by Supabase Auth (users never see this). */
function authEmailFromHandle(handle) {
  const h = String(handle || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  return h + '@example.com';
}

/** Normalize username: lowercase, letters/numbers/underscore only. */
function normalizeHandle(handle) {
  return String(handle || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

/** Check if a username is already taken. */
async function isHandleTaken(handle) {
  const h = normalizeHandle(handle);
  if (!h) return { taken: true, error: { message: 'Invalid username' } };
  const { data, error } = await sb
    .from('profiles')
    .select('id')
    .eq('handle', h)
    .maybeSingle();
  if (error) return { taken: false, error };
  return { taken: !!data, error: null };
}

/**
 * Sign up with username + password + display name (no email shown to user).
 * Also accepts legacy call: signUp(email, password, handle, displayName).
 */
async function signUp(handleOrEmail, password, displayNameOrHandle, maybeDisplay) {
  let h, display;
  if (typeof handleOrEmail === 'string' && handleOrEmail.includes('@')) {
    h = normalizeHandle(displayNameOrHandle || handleOrEmail.split('@')[0]);
    display = (maybeDisplay && String(maybeDisplay).trim()) || h;
  } else {
    h = normalizeHandle(handleOrEmail);
    display = (displayNameOrHandle && String(displayNameOrHandle).trim()) || h;
  }

  if (h.length < 3) {
    return { data: null, error: { message: 'Username must be at least 3 characters (a-z, 0-9, _)' } };
  }
  if (!password || password.length < 6) {
    return { data: null, error: { message: 'Password must be at least 6 characters' } };
  }

  try {
    const { taken } = await isHandleTaken(h);
    if (taken) return { data: null, error: { message: 'That username is already taken' } };
  } catch (_) {}

  const email = authEmailFromHandle(h);
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        handle: h,
        display_name: display
      }
    }
  });
  return { data, error };
}

/** Sign in with username + password (no email shown to user). */
async function signIn(handleOrEmail, password) {
  let email;
  if (typeof handleOrEmail === 'string' && handleOrEmail.includes('@')) {
    email = handleOrEmail.trim().toLowerCase();
  } else {
    const h = normalizeHandle(handleOrEmail);
    if (!h) return { data: null, error: { message: 'Enter your username' } };
    email = authEmailFromHandle(h);
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signOut() {
  const { error } = await sb.auth.signOut();
  return { error };
}

// ------------------------------------------------------------
// Profile helpers
// ------------------------------------------------------------
async function getProfile(userId) {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

async function getMyProfile() {
  const user = await getUser();
  if (!user) return { data: null, error: null };
  return getProfile(user.id);
}

async function updateProfile(updates) {
  const user = await getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { data, error } = await sb
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();
  return { data, error };
}

/** Award coins to the current user (client-side call to RPC). */
async function addCoins(amount) {
  const user = await getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { data, error } = await sb.rpc('add_coins', {
    p_user_id: user.id,
    p_amount: amount
  });
  return { data, error };
}

// ------------------------------------------------------------
// Scores / leaderboards
// ------------------------------------------------------------
async function submitScore(game, score, meta = {}) {
  const user = await getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { data, error } = await sb
    .from('scores')
    .insert({ user_id: user.id, game, score, meta })
    .select()
    .single();
  return { data, error };
}

/** Top N scores for a game (with profile info). */
async function getLeaderboard(game, limit = 20) {
  const { data, error } = await sb
    .from('scores')
    .select(`
      id, score, created_at, meta,
      profiles ( handle, display_name, avatar_url )
    `)
    .eq('game', game)
    .order('score', { ascending: false })
    .limit(limit);
  return { data, error };
}

/** Best score of the current user for a game. */
async function getMyBest(game) {
  const user = await getUser();
  if (!user) return { data: null, error: null };
  const { data, error } = await sb
    .from('scores')
    .select('score')
    .eq('user_id', user.id)
    .eq('game', game)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

// ------------------------------------------------------------
// The Void (public chat)
// ------------------------------------------------------------
async function getVoidMessages(limit = 50) {
  const { data, error } = await sb
    .from('void_messages')
    .select(`
      id, content, created_at,
      profiles ( handle, display_name, avatar_url )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

async function postVoidMessage(content) {
  const user = await getUser();
  if (!user) return { error: { message: 'Not signed in' } };
  const { data, error } = await sb
    .from('void_messages')
    .insert({ user_id: user.id, content: content.trim() })
    .select()
    .single();
  return { data, error };
}

/** Subscribe to new void messages (Realtime). */
function subscribeVoid(callback) {
  return sb
    .channel('void')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'void_messages' },
      async (payload) => {
        const { data } = await sb
          .from('void_messages')
          .select(`id, content, created_at, profiles ( handle, display_name, avatar_url )`)
          .eq('id', payload.new.id)
          .single();
        if (data) callback(data);
      }
    )
    .subscribe();
}

// ------------------------------------------------------------
// Top-bar UI helper (call from any page)
// ------------------------------------------------------------
async function refreshTopbar() {
  const nameEl = document.getElementById('user-name');
  const handleEl = document.getElementById('user-handle');
  const coinEl = document.getElementById('coin-count');

  const { data: profile } = await getMyProfile();

  if (profile) {
    if (nameEl) nameEl.textContent = profile.display_name || profile.handle;
    if (handleEl) handleEl.textContent = '@' + profile.handle;
    if (coinEl) coinEl.textContent = (profile.coins || 0).toLocaleString('en-US');
  } else {
    if (nameEl) nameEl.textContent = 'Guest';
    if (handleEl) handleEl.textContent = '@guest';
    if (coinEl) coinEl.textContent = '0';
  }
}

// Export for modules / global use
window.Paradox = {
  sb,
  getSession,
  getUser,
  signUp,
  signIn,
  signOut,
  normalizeHandle,
  isHandleTaken,
  getProfile,
  getMyProfile,
  updateProfile,
  addCoins,
  submitScore,
  getLeaderboard,
  getMyBest,
  getVoidMessages,
  postVoidMessage,
  subscribeVoid,
  refreshTopbar
};
