// Where data lives.
// Live site (config.js has Supabase keys): contributor accounts through Supabase Auth, a private collection per account,
// public entries only when a contributor shares one, and consent choices in a separate profile.
// Preview (no keys): everything stays in this browser so the interface can be tried, and the page says so.

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { } }
};
const K_MATS = "iam.materials.v1", K_MINE = "iam.mine.v1", K_SHARED = "iam.shared.v1", K_READINGS = "iam.readings.v1", K_ALIAS = "iam.alias.v1", K_PENDING = "iam.pending.v1";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));
const here = () => location.origin + location.pathname;
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

const cfg = window.IAM_CONFIG || {};
let sb = null, sbReady = null, currentUser = null, currentProfile = null, mineCache = [];
export const online = () => !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

async function client() {
  if (!online()) return null;
  if (sbReady) return sbReady;
  sbReady = (async () => {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm");
    // PKCE puts the sign-in code in ?code=, which keeps the site's #hash routes free
    sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: "iam.auth", flowType: "pkce", detectSessionInUrl: true, autoRefreshToken: true } });
    sb.auth.onAuthStateChange((event, session) => {
      const was = currentUser && currentUser.id;
      currentUser = session ? session.user : null;
      if (event === "PASSWORD_RECOVERY") emit("iam:recovery");
      if ((currentUser && currentUser.id) !== was) setTimeout(() => refresh().then(() => emit("iam:auth", { event })), 0);
    });
    const { data } = await sb.auth.getSession();
    currentUser = data.session ? data.session.user : null;
    if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
    return sb;
  })();
  return sbReady;
}

// load the profile and the collection for whoever is signed in
async function refresh() {
  if (!online()) { mineCache = LS.get(K_MINE, []); return; }
  const c = await client();
  if (!currentUser) { currentProfile = null; mineCache = []; return; }
  const [{ data: prof }, { data: rows, error }] = await Promise.all([
    c.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
    c.from("collection").select("*").order("created_at", { ascending: false })
  ]);
  if (error) console.error(error);
  currentProfile = prof || null;
  mineCache = rows || [];
}
export async function ready() { try { await client(); await refresh(); } catch (e) { console.error(e); } }

// ---------- accounts ----------
export const mode = () => !online() ? "preview" : currentUser ? "account" : "guest";
export const user = () => currentUser;
export const profile = () => currentProfile;
export const canSave = () => mode() !== "guest";

export async function signUp({ email, password, research, publish }) {
  const c = await client(); if (!c) throw new Error("Accounts are only available on the live site.");
  const now = new Date().toISOString();
  const { data, error } = await c.auth.signUp({ email, password, options: { emailRedirectTo: here(), data: { terms_at: now, privacy_at: now, research_consent: !!research, publish_consent: !!publish } } });
  if (error) throw error;
  return { needsVerification: !data.session };
}
export async function signIn({ email, password }) {
  const c = await client(); if (!c) throw new Error("Accounts are only available on the live site.");
  const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error;
  await refresh();
}
export async function signOut() { const c = await client(); if (c) await c.auth.signOut(); currentUser = null; await refresh(); }
export async function resetPassword(email) {
  const c = await client(); if (!c) throw new Error("Accounts are only available on the live site.");
  const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: here() }); if (error) throw error;
}
export async function updatePassword(password) { const c = await client(); const { error } = await c.auth.updateUser({ password }); if (error) throw error; }
export async function resendVerification(email) { const c = await client(); const { error } = await c.auth.resend({ type: "signup", email, options: { emailRedirectTo: here() } }); if (error) throw error; }
export async function deleteAccount() {
  const c = await client();
  const { error } = await c.rpc("delete_my_account"); if (error) throw error;
  await c.auth.signOut(); currentUser = null; await refresh();
}
// research consent and publishing consent are separate, and each can be withdrawn
export async function setConsent({ research, publish }) {
  const c = await client(); const now = new Date().toISOString(); const patch = {};
  if (research !== undefined) Object.assign(patch, { research_consent: research, research_consent_at: research ? now : null });
  if (publish !== undefined) Object.assign(patch, { publish_consent: publish, publish_consent_at: publish ? now : null });
  const { data, error } = await c.from("profiles").upsert({ id: currentUser.id, ...patch }).select("*").single();
  if (error) throw error; currentProfile = data;
}
export const publishAllowed = () => mode() === "preview" || !!(currentProfile && currentProfile.publish_consent);

// ---------- my collection ----------
const entryShape = e => ({
  material_id: e.material_id, alias: (e.alias || "").slice(0, 40) || null, observe: e.observe || {},
  meaning: e.meaning.slice(0, 80), meaning_note: (e.meaning_note || "").slice(0, 400), voice: (e.voice || "").slice(0, 200),
  body: e.body || null, own_body_note: (e.own_body_note || "").slice(0, 400), revisions: e.revisions || []
});
export const mine = () => mineCache;
export const getMine = id => mineCache.find(e => e.id === id);

export async function addMine(entry) {
  if (mode() === "account") {
    const c = await client();
    const { data, error } = await c.from("collection").insert({ ...entryShape(entry), shared: false }).select("*").single();
    if (error) throw error;
    mineCache = [data, ...mineCache]; return data;
  }
  if (mode() === "guest") throw new Error("Sign in to save.");
  const e = { id: uid(), created_at: new Date().toISOString(), revisions: [], shared: false, remote_id: null, ...entry };
  mineCache = [e, ...mineCache]; LS.set(K_MINE, mineCache); return e;
}
export async function updateMine(id, patch) {
  if (mode() === "account") {
    const c = await client();
    const { data, error } = await c.from("collection").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) throw error;
    mineCache = mineCache.map(e => e.id === id ? data : e); return data;
  }
  mineCache = mineCache.map(e => e.id === id ? { ...e, ...patch } : e); LS.set(K_MINE, mineCache);
  return getMine(id);
}
export async function deleteMine(id) {
  if (mode() === "account") { const c = await client(); const { error } = await c.from("collection").delete().eq("id", id); if (error) throw error; }
  mineCache = mineCache.filter(e => e.id !== id);
  if (mode() !== "account") LS.set(K_MINE, mineCache);
}

// entries saved in this browser before accounts existed, offered for import after signing in
export const localEntries = () => online() ? LS.get(K_MINE, []) : [];
export async function importLocal() {
  const list = LS.get(K_MINE, []);
  for (const e of [...list].reverse()) await addMine({ ...e, alias: "" });
  LS.del(K_MINE);
}
export const dismissLocal = () => LS.del(K_MINE);

// a meaning written before signing in, kept until it is saved
export const pending = () => LS.get(K_PENDING, null);
export const setPending = d => d ? LS.set(K_PENDING, d) : LS.del(K_PENDING);

export const alias = () => LS.get(K_ALIAS, "");
export const setAlias = a => LS.set(K_ALIAS, a);

// ---------- shared archive ----------
export async function share(entry) {
  const row = entryShape(entry);
  const c = await client();
  if (c) {
    const { data, error } = await c.from("entries").insert(row).select("id").single();
    if (error) throw error;
    return data.id;
  }
  const list = LS.get(K_SHARED, []);
  const id = uid();
  list.unshift({ id, created_at: new Date().toISOString(), ...row });
  LS.set(K_SHARED, list);
  return id;
}

export async function updateShared(remoteId, entry) {
  const c = await client();
  const patch = { revisions: entry.revisions, meaning_note: entry.meaning_note, voice: entry.voice, body: entry.body || null, own_body_note: entry.own_body_note || "" };
  if (c) { const { error } = await c.from("entries").update(patch).eq("id", remoteId); if (error) throw error; return; }
  const list = LS.get(K_SHARED, []); const i = list.findIndex(x => x.id === remoteId);
  if (i >= 0) { Object.assign(list[i], patch); LS.set(K_SHARED, list); }
}

export async function unshare(remoteId) {
  const c = await client();
  if (c) { const { error } = await c.from("entries").delete().eq("id", remoteId); if (error) throw error; return; }
  LS.set(K_SHARED, LS.get(K_SHARED, []).filter(x => x.id !== remoteId));
}

let sharedCache = null, sharedAt = 0;
export async function listShared({ fresh = false } = {}) {
  if (!fresh && sharedCache && Date.now() - sharedAt < 20000) return sharedCache;
  const c = await client();
  let rows;
  if (c) {
    const { data, error } = await c.from("entries").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    rows = data;
  } else rows = LS.get(K_SHARED, []);
  sharedCache = rows; sharedAt = Date.now();
  return rows;
}
export const invalidate = () => { sharedCache = null; };

// ---------- readings (guesses at someone's movement) ----------
export async function addReading(entryId, text) {
  const row = { entry_id: entryId, text: text.slice(0, 200) };
  const c = await client();
  if (c && currentUser && !String(entryId).startsWith("ex-")) {
    const { error } = await c.from("readings").insert(row); if (error) throw error; return;
  }
  const all = LS.get(K_READINGS, []); all.unshift({ id: uid(), created_at: new Date().toISOString(), ...row }); LS.set(K_READINGS, all);
}
export async function readingsFor(entryIds) {
  if (!entryIds.length) return [];
  const c = await client();
  const local = LS.get(K_READINGS, []).filter(r => entryIds.includes(r.entry_id));
  if (c) {
    const ids = entryIds.filter(id => !String(id).startsWith("ex-"));
    if (!ids.length) return local;
    const { data, error } = await c.from("readings").select("*").in("entry_id", ids).order("created_at", { ascending: false });
    if (error) throw error;
    return [...data, ...local.filter(r => String(r.entry_id).startsWith("ex-"))];
  }
  return local;
}

// ---------- community materials ----------
const matId = () => "c-" + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

export async function listMaterials() {
  const local = LS.get(K_MATS, []);
  const c = await client();
  if (!c) return local;
  const { data, error } = await c.from("materials").select("*").order("created_at", { ascending: true }).limit(500);
  if (error) throw error;
  const seen = new Set(data.map(m => m.id));
  return [...data, ...local.filter(m => !seen.has(m.id) && !m.remote)];
}

export async function addMaterial({ name, note, parent }) {
  const row = { id: matId(), name: name.trim().slice(0, 40), note: (note || "").trim().slice(0, 160) || null };
  if (parent) row.parent = parent;
  const c = await client();
  let remote = false;
  if (c) {
    if (!currentUser) throw new Error("Sign in to register a material.");
    let { error } = await c.from("materials").insert(row);
    // databases set up before varieties existed have no parent column: keep the link on this device only
    if (error && row.parent) { const { parent, ...plain } = row; ({ error } = await c.from("materials").insert(plain)); }
    if (error) throw error; remote = true;
  }
  const list = LS.get(K_MATS, []); list.push({ ...row, created_at: new Date().toISOString(), remote }); LS.set(K_MATS, list);
  return row;
}

// ---------- export ----------
export function exportAll() {
  return JSON.stringify({ exported_at: new Date().toISOString(), account: currentUser ? currentUser.email : null, entries: mineCache }, null, 2);
}
