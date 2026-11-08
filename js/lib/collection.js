// My Collection: the translations a visitor writes, kept privately in THIS browser (localStorage).
// Limitation, stated on the page: nothing here is uploaded unless the visitor chooses
// "Contribute to the Lab". Clearing browser data or switching device loses the collection.
import { LS } from "./util.js?v=202611082312";

const KEY = "iam.collection.v1";
const load = () => { const d = LS.get(KEY, null); return d && Array.isArray(d.items) ? d : { seq: 0, items: [] }; };
const save = d => { if (!LS.set(KEY, d)) throw new Error("This browser would not let the Library save. Private windows sometimes block storage."); };
const subs = new Set();
const emit = () => subs.forEach(f => f());
export const onChange = f => (subs.add(f), () => subs.delete(f));

export const MAX = 1000;
export const clean = s => String(s || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX);

export const list = () => load().items.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
export const get = id => load().items.find(t => t.id === id);
export const count = () => load().items.length;

export function create(object, text) {
  const body = clean(text);
  if (!body) throw new Error("Write at least a few words first.");
  const d = load();
  d.seq += 1;
  const now = new Date().toISOString();
  const t = {
    id: "P-" + String(d.seq).padStart(3, "0"),
    materialId: object.key, materialSlug: object.slug, objectNo: object.no, materialName: object.name,
    action: object.primaryAction, text: body,
    sourceType: "PERSONAL", sourceLabel: "My Collection",
    createdAt: now, updatedAt: now,
    visibility: "private", submissionStatus: "PRIVATE", displayName: null,
    contribution: null // { id, token, queue: "database" | "browser", submittedAt }
  };
  d.items.push(t); save(d); emit();
  return t;
}

export function patch(id, fields) {
  const d = load(); const t = d.items.find(x => x.id === id);
  if (!t) throw new Error("This translation is no longer in your collection.");
  Object.assign(t, fields, { updatedAt: new Date().toISOString() });
  save(d); emit(); return t;
}

export function editText(id, text) {
  const t = get(id);
  if (!t) throw new Error("This translation is no longer in your collection.");
  if (t.submissionStatus !== "PRIVATE") throw new Error("Withdraw the contribution first, then edit.");
  const body = clean(text);
  if (!body) throw new Error("A translation cannot be empty.");
  return patch(id, { text: body });
}

export function remove(id) {
  const d = load(); d.items = d.items.filter(t => t.id !== id); save(d); emit();
}
