// Joins the catalogue (numbers, status) with the material records (content).
import { CATALOGUE, RESERVED, STATUS, COLLECTION_NAME } from "../data/catalogue.js?v=202611061240";
import { MATERIALS } from "../data/materials.js?v=202611061240";
import { TRANSLATIONS } from "../data/translations.js?v=202611061240";

export const OBJECTS = CATALOGUE.map(c => ({ ...MATERIALS[c.slug], ...c, collection: COLLECTION_NAME }));
export const RESERVED_SLOTS = RESERVED.map(no => ({ no, status: "awaiting-cataloguing", reserved: true }));
export const ENTRIES = [...OBJECTS, ...RESERVED_SLOTS];
export const PUBLISHED = OBJECTS.filter(o => o.status === "published");

export const bySlug = slug => OBJECTS.find(o => o.slug === slug);
export const byKey = key => OBJECTS.find(o => o.key === key);
export const isOpen = o => o && o.status === "published";
export const statusLabel = s => (STATUS[s] || STATUS["under-observation"]).label;
export const workshopTranslations = slug => TRANSLATIONS.filter(t => t.materialSlug === slug);

// next / previous published record, for moving through the library
export function neighbours(slug) {
  const i = PUBLISHED.findIndex(o => o.slug === slug);
  const n = PUBLISHED.length;
  return { prev: PUBLISHED[(i - 1 + n) % n], next: PUBLISHED[(i + 1) % n] };
}

// links to an object's sections
export const href = {
  home: "#/", library: "#/library", collection: "#/collection", about: "#/about",
  object: o => `#/object/${o.slug}`,
  become: o => `#/object/${o.slug}/become`,
  record: id => `#/collection/${id}`,
  contribute: id => `#/collection/${id}/contribute`
};
