// Contribute to the Lab: optional public submission with moderation.
// Backend: Supabase table `library_contributions` (supabase/contributions.sql).
//   PRIVATE  -> visitor submits -> PENDING_REVIEW (row stored, invisible to the public)
//   Lynn sets status = 'published' in Supabase Table Editor -> PUBLISHED (shown on the material page)
//   Withdraw: the visitor's browser holds a secret token; withdraw_contribution() deletes the row.
// If the database cannot be reached (or the SQL has not been run yet), the submission is held in this
// browser, labelled honestly, and sent the next time My Collection opens. Nothing is ever shown as
// published until Lynn has approved it.
import { uuid, token } from "./util.js?v=202611061240";
import * as col from "./collection.js?v=202611061240";

const cfg = window.IAM_CONFIG || {};
const TABLE = "library_contributions";
let sb = null;
function client() {
  if (!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY)) return Promise.resolve(null);
  if (!sb) sb = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm")
    .then(({ createClient }) => createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } }))
    .catch(e => { console.warn("Library database not reachable.", e); return null; });
  return sb;
}

async function send(t) {
  const c = await client();
  if (!c) return false;
  const { error } = await c.from(TABLE).insert({
    id: t.contribution.id, material_key: t.materialId, object_no: t.objectNo, action: t.action,
    text: t.text, display_name: t.displayName, personal_id: t.id, consent: true, withdraw_token: t.contribution.token
  });
  if (error) { console.warn("Contribution not sent:", error.message || error); return false; }
  return true;
}

export async function submit(id, { displayName }) {
  const t = col.get(id);
  if (!t) throw new Error("This translation is no longer in your collection.");
  if (t.submissionStatus !== "PRIVATE") return t;
  const name = displayName ? String(displayName).replace(/\s+/g, " ").trim().slice(0, 40) : null;
  col.patch(id, { displayName: name, contribution: { id: uuid(), token: token(), queue: "browser", submittedAt: new Date().toISOString() } });
  const sent = await send(col.get(id));
  return col.patch(id, { submissionStatus: "PENDING_REVIEW", visibility: "submitted", contribution: { ...col.get(id).contribution, queue: sent ? "database" : "browser" } });
}

// resend held submissions and pick up approvals. Called when My Collection opens.
export async function sync() {
  const items = col.list().filter(t => t.contribution);
  for (const t of items.filter(t => t.contribution.queue === "browser" && t.submissionStatus === "PENDING_REVIEW")) {
    if (await send(t)) col.patch(t.id, { contribution: { ...t.contribution, queue: "database" } });
  }
  const live = col.list().filter(t => t.contribution && t.contribution.queue === "database");
  if (!live.length) return;
  const c = await client(); if (!c) return;
  const { data, error } = await c.from(TABLE).select("id").in("id", live.map(t => t.contribution.id));
  if (error) { console.warn("Could not check contribution status:", error.message || error); return; }
  const published = new Set((data || []).map(r => r.id));
  live.forEach(t => {
    const s = published.has(t.contribution.id) ? "PUBLISHED" : "PENDING_REVIEW";
    if (t.submissionStatus !== s) col.patch(t.id, { submissionStatus: s, visibility: s === "PUBLISHED" ? "public" : "submitted" });
  });
}

export async function withdraw(id) {
  const t = col.get(id);
  if (!t || !t.contribution) return t;
  if (t.contribution.queue === "database") {
    const c = await client();
    if (!c) throw new Error("The Library cannot be reached right now, so the withdrawal could not be sent. Try again later.");
    const { error } = await c.rpc("withdraw_contribution", { p_id: t.contribution.id, p_token: t.contribution.token });
    if (error) throw new Error("The withdrawal could not be sent (" + (error.message || "unknown error") + "). Try again later.");
  }
  return col.patch(id, { submissionStatus: "PRIVATE", visibility: "private", contribution: null, displayName: null });
}

// approved visitor translations for one material, shown on its detail page
export async function publishedFor(object) {
  const c = await client(); if (!c) return [];
  const { data, error } = await c.from(TABLE).select("id, material_key, object_no, action, text, display_name, created_at")
    .eq("material_key", object.key).order("created_at", { ascending: true }).limit(200);
  if (error) { console.warn("Public contributions unavailable:", error.message || error); return []; }
  return (data || []).map((r, i) => ({
    id: "C-" + String(i + 1).padStart(3, "0"), materialSlug: object.slug, action: r.action, text: r.text,
    sourceType: "PUBLIC_CONTRIBUTION", sourceLabel: r.display_name ? `Contributed by ${r.display_name}` : "Anonymous contribution", createdAt: r.created_at
  }));
}
