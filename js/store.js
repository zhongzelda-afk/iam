// Readings: one line a visitor leaves next to an item. No accounts.
// Live site: stored in the Supabase table `library_readings` (see supabase/library.sql), readable by everyone.
// If the database is not reachable or the table is not set up yet, the reading is kept in this browser
// so the journey still works (for example during a playtest), and nothing is lost on screen.
// Older public entries from the previous site version (`entries`) are shown as readings too.

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};
const K_LOCAL = "iam.library.readings.v1";
const K_MINE = "iam.library.mine.v1";

const cfg = window.IAM_CONFIG || {};
const online = () => !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));

let sbReady = null;
function client() {
  if (!online()) return Promise.resolve(null);
  if (!sbReady) sbReady = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm")
    .then(({ createClient }) => createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }))
    .catch(e => { console.warn("Database not reachable, readings stay in this browser.", e); return null; });
  return sbReady;
}

export const LIMITS = { text: 280, name: 40 };
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// a reading from the older `entries` table, shaped like a library reading
const fromEntry = e => {
  const text = clean(e.voice || e.meaning_note || e.meaning, LIMITS.text);
  return text ? { id: "e-" + e.id, material_id: e.material_id, text, name: clean(e.alias, LIMITS.name), created_at: e.created_at } : null;
};

const cache = new Map();
export async function readingsFor(materialId, { fresh = false } = {}) {
  if (!fresh && cache.has(materialId)) return cache.get(materialId);
  const local = LS.get(K_LOCAL, []).filter(r => r.material_id === materialId);
  let remote = [];
  const c = await client();
  if (c) {
    const [lib, old] = await Promise.all([
      c.from("library_readings").select("id, material_id, text, name, created_at").eq("material_id", materialId).order("created_at", { ascending: false }).limit(200),
      c.from("entries").select("id, material_id, alias, meaning, meaning_note, voice, created_at").eq("material_id", materialId).order("created_at", { ascending: false }).limit(200)
    ]).catch(e => [{ error: e }, { error: e }]);
    if (lib.error) console.warn("library_readings:", lib.error.message || lib.error);
    if (old.error) console.warn("entries:", old.error.message || old.error);
    remote = [...(lib.data || []), ...(old.data || []).map(fromEntry).filter(Boolean)];
  }
  const seen = new Set(remote.map(r => r.id));
  const all = [...remote, ...local.filter(r => !seen.has(r.id))]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  cache.set(materialId, all);
  return all;
}

export async function addReading(materialId, text, name) {
  const row = { id: uid(), material_id: materialId, text: clean(text, LIMITS.text), name: clean(name, LIMITS.name) || null, created_at: new Date().toISOString() };
  if (!row.text) throw new Error("Write a few words first.");
  let stored = "browser";
  const c = await client();
  if (c) {
    const { error } = await c.from("library_readings").insert({ id: row.id, material_id: row.material_id, text: row.text, name: row.name });
    if (error) console.warn("Could not save to the database, keeping the reading in this browser.", error.message || error);
    else stored = "library";
  }
  if (stored === "browser") { const list = LS.get(K_LOCAL, []); list.unshift(row); LS.set(K_LOCAL, list); }
  const mine = LS.get(K_MINE, []); mine.unshift({ id: row.id, material_id: materialId }); LS.set(K_MINE, mine.slice(0, 200));
  cache.delete(materialId);
  return { ...row, stored };
}

// ids of readings left from this browser, so a visitor can spot their own line again
export const myReadingIds = () => new Set(LS.get(K_MINE, []).map(r => r.id));
