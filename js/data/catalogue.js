// I.A.M. catalogue: the ONE place that decides object numbers and record status.
// Edit this file to renumber an object or to publish it. Nothing else needs to change.
//
// key     stable record id used since site v0.1. Never change it: saved translations and the
//         Supabase tables refer to it.
// slug    the web address, e.g. #/object/orange
// no      the object number printed on the website, booklets and in the exhibition.
// status  "published"          complete record, opens a detail page
//         "under-observation"  research in progress, shown but not opened
//         (reserved slots below are "awaiting-cataloguing")
// note    one line shown on an unpublished entry
//
// NUMBERING: only OBJECT 001 = ORANGE is confirmed (Lynn's build brief, 4 Nov 2026).
// 002 to 011 are a DRAFT order (filmed objects first after the three exhibition objects).
// The State Booklet still prints No 004 for the Orange, so update it if 001 stands.
export const NUMBERING_CONFIRMED = ["001"];

export const CATALOGUE = [
  { key: "004", slug: "orange",         no: "001", status: "published" },
  { key: "003", slug: "aluminium-foil", no: "002", status: "under-observation", note: "Not yet filmed" },
  { key: "001", slug: "cleaning-sponge",no: "003", status: "under-observation", note: "Not yet filmed" },
  { key: "002", slug: "ice",            no: "004", status: "published" },
  { key: "006", slug: "tomato",         no: "005", status: "published" },
  { key: "009", slug: "cream-foam",     no: "006", status: "published" },
  { key: "012", slug: "rose",           no: "007", status: "under-observation", note: "Filmed · record being written" },
  { key: "013", slug: "cabbage-leaf",   no: "008", status: "under-observation", note: "Filmed · record being written" },
  { key: "007", slug: "pear",           no: "009", status: "under-observation", note: "Not yet filmed" },
  { key: "008", slug: "shaving-foam",   no: "010", status: "under-observation", note: "Not yet filmed" },
  { key: "014", slug: "madeleine",      no: "011", status: "under-observation", note: "Not yet filmed" }
];

// Reserved archive positions: the library keeps growing. Turn one into a real object by
// adding it to CATALOGUE (with a new key) and MATERIALS, and deleting it here.
export const RESERVED = ["012", "013", "014"];

export const STATUS = {
  "published": { label: "Published", short: "Published" },
  "under-observation": { label: "Under observation", short: "Under observation" },
  "awaiting-cataloguing": { label: "Awaiting cataloguing", short: "Awaiting cataloguing" }
};

export const COLLECTION_NAME = "Library of Found Materials";
