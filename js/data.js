// The founding collection: 11 materials.
// `behaviour` is one short physical description. Meanings never live here: they belong to people.
// display: "cube" or "vial". To use a real photo, add assets/materials/<id>.jpg and set photo: true.

export const FOUNDING = [
  { id: "001", name: "Sponge", display: "cube", tex: "sponge", behaviour: "Gives way at once, then springs back." },
  { id: "002", name: "Ice", display: "cube", tex: "ice", behaviour: "Resists, then slowly melts away." },
  { id: "003", name: "Aluminium Foil", display: "cube", tex: "foil", behaviour: "Creases at a touch and keeps every fold." },
  { id: "004", name: "Orange", display: "vial", tex: "orange", behaviour: "Holds firm, then bruises and leaks." },
  { id: "005", name: "Bread", display: "cube", tex: "bread", behaviour: "Squashes softly and returns slowly." },
  { id: "006", name: "Tomato", display: "vial", tex: "tomato", behaviour: "Holds the pressure, then splits." },
  { id: "007", name: "Pear", display: "vial", tex: "pear", behaviour: "Looks unchanged, then browns where it was pressed." },
  { id: "008", name: "Shaving Foam", display: "vial", tex: "foam", behaviour: "Flattens, clings to the hand, slowly collapses." },
  { id: "009", name: "Cream Foam", display: "vial", tex: "cream", behaviour: "Takes a print, then sinks and melts." },
  { id: "010", name: "Clay", display: "cube", tex: "clay", behaviour: "Records the press exactly and keeps it." },
  { id: "011", name: "Gel", display: "cube", tex: "gel", behaviour: "Wobbles under pressure and settles back." }
];

// community materials are added at runtime (see store.js)
let community = [];
export const setCommunity = list => {
  community = [...list].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((c, i) => ({ ...c, no: String(FOUNDING.length + 1 + i).padStart(3, "0"), behaviour: c.note || "", community: true, display: "cube", tex: "community" }));
};
export const allMaterials = () => [...FOUNDING, ...community];

// ids from earlier versions of the site
const LEGACY = { "001.01": "001", "002.01": "002", "003.01": "003", "004.01": "004", "005.01": "005", "006.01": "006", "007.01": "007", "008.01": "008", "008.02": "009", "009.01": "010" };
export const canonical = id => LEGACY[id] || id;
export const byId = id => allMaterials().find(m => m.id === canonical(id));

export const ACTIONS = [
  { verb: "Press", line: "Press it with an open palm." },
  { verb: "Squeeze", line: "Close your hand around it." },
  { verb: "Fold", line: "Fold it in half." },
  { verb: "Poke", line: "Push one finger in." },
  { verb: "Stretch", line: "Pull it apart, gently." },
  { verb: "Twist", line: "Turn it in both hands." },
  { verb: "Warm", line: "Hold it until it changes." },
  { verb: "Drop", line: "Let it fall." },
  { verb: "Leave it", line: "Do nothing. Wait." }
];

export const RESPONSE_WORDS = ["springs back", "keeps the mark", "melts", "splits", "clings", "collapses", "leaks", "returns slowly", "resists", "nothing happens"];

// Examples written by the Institute to show the format.
// Labelled as examples and hidden once a real entry exists for that material.
export const EXAMPLES = [
  { id: "ex-1", example: true, material_id: "001", alias: "Example", meaning: "Resilience", meaning_note: "It lets everything in and still comes back.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", example: true, material_id: "002", alias: "Example", meaning: "Loss", meaning_note: "Whatever it holds is already leaving.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here." }] },
  { id: "ex-3", example: true, material_id: "003", alias: "Example", meaning: "Memory", meaning_note: "You can flatten it but not erase it.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
