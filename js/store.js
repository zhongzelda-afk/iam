// Where entries live.
// My Dictionary is always kept in this browser (localStorage).
// Shared entries and readings go to Supabase when config.js has keys; otherwise they stay on this device.

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};
const K_MINE = "iam.mine.v1", K_SHARED = "iam.shared.v1", K_READINGS = "iam.readings.v1", K_ALIAS = "iam.alias.v1", K_DRAFT = "iam.draft.v1";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));

const cfg = window.IAM_CONFIG || {};
let sb = null, sbReady = null;
export const online = () => !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

async function client() {
  if (!online()) return null;
  if (sbReady) return sbReady;
  sbReady = (async () => {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
    sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: "iam.auth" } });
    // anonymous identity so a visitor can later revise or withdraw what they shared
    const { data } = await sb.auth.getSession();
    if (!data.session) { try { await sb.auth.signInAnonymously(); } catch (e) { console.warn("Anonymous sign-in unavailable", e); } }
    return sb;
  })();
  return sbReady;
}

// ---------- my dictionary ----------
export const mine = () => LS.get(K_MINE, []);
const saveMine = list => LS.set(K_MINE, list);
export const getMine = id => mine().find(e => e.id === id);

export function addMine(entry) {
  const list = mine();
  const e = { id: uid(), created_at: new Date().toISOString(), revisions: [], shared: false, remote_id: null, ...entry };
  e.no = (list.reduce((m, x) => Math.max(m, x.no || 0), 0) + 1);
  list.unshift(e); saveMine(list); return e;
}
export function updateMine(id, patch) {
  const list = mine(); const i = list.findIndex(e => e.id === id); if (i < 0) return null;
  list[i] = { ...list[i], ...patch }; saveMine(list); return list[i];
}
export function deleteMine(id) { saveMine(mine().filter(e => e.id !== id)); }

export const alias = () => LS.get(K_ALIAS, "");
export const setAlias = a => LS.set(K_ALIAS, a);
export const draft = () => LS.get(K_DRAFT, null);
export const setDraft = d => LS.set(K_DRAFT, d);

// ---------- shared archive ----------
const publicShape = e => ({
  material_id: e.material_id,
  alias: (e.alias || "").slice(0, 40) || null,
  observe: e.observe || {},
  meaning: e.meaning.slice(0, 80),
  meaning_note: (e.meaning_note || "").slice(0, 400),
  voice: (e.voice || "").slice(0, 200),
  body: e.body || null,
  own_body_note: (e.own_body_note || "").slice(0, 400),
  revisions: e.revisions || []
});

export async function share(entry) {
  const row = publicShape(entry);
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
  if (c) {
    const { error } = await c.from("entries").update({ revisions: entry.revisions, meaning_note: entry.meaning_note, voice: entry.voice }).eq("id", remoteId);
    if (error) throw error; return;
  }
  const list = LS.get(K_SHARED, []); const i = list.findIndex(x => x.id === remoteId);
  if (i >= 0) { list[i].revisions = entry.revisions; LS.set(K_SHARED, list); }
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

// ---------- readings (reinterpretations) ----------
export async function addReading(entryId, text) {
  const row = { entry_id: entryId, text: text.slice(0, 200) };
  const c = await client();
  if (c && !String(entryId).startsWith("ex-")) {
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

// ---------- export ----------
export function exportAll() {
  return JSON.stringify({ exported_at: new Date().toISOString(), alias: alias(), entries: mine() }, null, 2);
}
