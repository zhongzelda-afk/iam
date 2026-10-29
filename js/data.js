// The founding collection: 11 materials.
// Every text here comes from the Institute's earlier records (site v0.1 and v0.2). Nothing is filled in by guesswork:
// a field that was never recorded is left empty and the page says so.
// Physical fields describe what the material does. Meanings belong to people and live in entries.
//
//   language   the material's word in the material language
//   speed      "instant" | "delayed"      after   "returns" | "keeps"
//   response   short physical response    def     the Institute's definition (full observation)
//   specimen   the archive specimen       experiments   experiment records
// display: "cube" or "vial". To use a real photo, add assets/materials/<id>.jpg and set photo: true.

const NR = "Not recorded";
const press = o => ({ id: "E01", type: "Compression (open palm)", ...o });

export const FOUNDING = [
  { id: "001", name: "Sponge", display: "cube", tex: "sponge",
    language: "Compresses / Springs back", speed: "instant", after: "returns", response: "Compresses and recovers",
    def: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    specimen: { name: "Kitchen Sponge", variety: "Household cleaning sponge (type not recorded)", composition: "Open-cell foam with connected air pores", part: "Block", condition: "Dry, new", preparation: "Used as bought" },
    experiments: [press({ date: NR, context: "Bodystorming phase 1" })] },
  { id: "002", name: "Ice", display: "cube", tex: "ice",
    language: "Melting / Phase change", speed: "delayed", after: "keeps", response: "Melts",
    def: "Resists a press at first. Warmth from the hand slowly turns its surface to water; the shape that leaves does not come back without the freezer.",
    note: "Not yet filmed by the Institute.",
    specimen: { name: "Ice", variety: "Frozen tap water", composition: "Water in solid phase", part: "Cube", condition: "Frozen", preparation: "Household freezer tray" },
    experiments: [] },
  { id: "003", name: "Aluminium Foil", display: "cube", tex: "foil",
    language: "Creases / Keeps the mark", speed: "instant", after: "keeps", response: "Creases",
    def: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    specimen: { name: "Aluminium Foil", variety: "Household kitchen foil", composition: "Rolled aluminium sheet", part: "Sheet, folded", condition: "New", preparation: "Folded into a block for the archive" },
    experiments: [press({ date: NR, context: "Bodystorming phase 1" })] },
  { id: "004", name: "Orange", display: "vial", tex: "orange",
    language: "Bruises later / Leaks", speed: "delayed", after: "keeps", response: "Bruises and leaks",
    def: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays.",
    note: "Pressed 1 Oct 2026 and in bodystorming phase 1.",
    specimen: { name: "Orange", variety: "Sweet orange, cultivar not recorded", composition: "Oily peel over juice-filled segments", part: "Whole fruit", condition: "Fresh", preparation: "Unpeeled, room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment, also pressed in bodystorming phase 1" })] },
  { id: "005", name: "Bread", display: "cube", tex: "bread",
    language: "Slow return", speed: "delayed", after: "returns", response: "Compresses, returns slowly",
    def: "Squashes softly, then takes its time. Fresh crumb climbs back slowly; older bread stays flatter.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    specimen: { name: "Bread Crumb", variety: "Sliced white loaf", composition: "Baked wheat dough with gas cells", part: "Crumb, crust removed", condition: "Fresh", preparation: "Cut from the loaf" },
    experiments: [press({ date: NR, context: "Bodystorming phase 1" })] },
  { id: "006", name: "Tomato", display: "vial", tex: "tomato",
    language: "Splits / Leaks", speed: "delayed", after: "keeps", response: "Splits and leaks",
    def: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Tomato", variety: "Round tomato, cultivar not recorded", composition: "Thin skin over gel and seeds", part: "Whole fruit", condition: "Ripe", preparation: "Room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })] },
  { id: "007", name: "Pear", display: "vial", tex: "pear",
    language: "Bruises / Oxidises", speed: "delayed", after: "keeps", response: "Bruises, browns over time",
    def: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Pear", variety: "Cultivar not recorded", composition: "Thin skin over granular flesh", part: "Whole fruit", condition: "Ripe", preparation: "Room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })] },
  { id: "008", name: "Shaving Foam", display: "vial", tex: "foam",
    language: "Clings / Collapses", speed: "instant", after: "keeps", response: "Clings and collapses",
    def: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Shaving Foam", variety: "Aerosol shaving foam (brand not recorded)", composition: "Soap film around gas bubbles", part: "Dispensed mound", condition: "Freshly dispensed", preparation: "Sprayed onto a flat surface" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })] },
  { id: "009", name: "Cream Foam", display: "vial", tex: "cream",
    language: "Deflates / Melts", speed: "delayed", after: "keeps", response: "Deflates and melts",
    def: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Whipped Cream", variety: "Dairy cream, whipped", composition: "Fat-stabilised air bubbles in cream", part: "Dispensed mound", condition: "Fresh, chilled", preparation: "Whipped or dispensed" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })] },
  { id: "010", name: "Clay", display: "cube", tex: "clay",
    language: "Takes the shape", speed: "instant", after: "keeps", response: "Takes the shape",
    def: "Records the press exactly, down to the lines of the palm, and keeps it until someone reshapes it.",
    note: "Not yet filmed by the Institute.",
    specimen: { name: "Modelling Clay", variety: "Air-dry clay (brand not recorded)", composition: "Fine mineral particles with water", part: "Block", condition: "Moist", preparation: "Wrapped to stay workable" },
    experiments: [] },
  // Gel has no earlier record yet: its entry stays empty until the Institute writes one.
  { id: "011", name: "Gel", display: "cube", tex: "gel", experiments: [] }
];

export const SPEEDS = { instant: "Instant", delayed: "Delayed" };
export const AFTERS = { returns: "Returns toward first shape", keeps: "Keeps the change" };

// community materials are added at runtime (see store.js)
let community = [];
export const setCommunity = list => {
  community = [...list].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((c, i) => ({ ...c, no: String(FOUNDING.length + 1 + i).padStart(3, "0"), response: c.note || "", community: true, display: "cube", tex: "community", experiments: [] }));
};
export const allMaterials = () => [...FOUNDING, ...community];

// ids from earlier versions of the site
const LEGACY = { "001.01": "001", "002.01": "002", "003.01": "003", "004.01": "004", "005.01": "005", "006.01": "006", "007.01": "007", "008.01": "008", "008.02": "009", "009.01": "010" };
export const canonical = id => LEGACY[id] || id;
export const byId = id => allMaterials().find(m => m.id === canonical(id));

// The Institute's own interpretations, written in v0.1 to show the format.
// They are subjective readings, always labelled as I.A.M. interpretations.
export const EXAMPLES = [
  { id: "ex-1", example: true, material_id: "001", alias: "I.A.M.", meaning: "Resilience", meaning_note: "It lets everything in and still comes back to itself.", voice: "Press me. I will be here in a second.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", example: true, material_id: "002", alias: "I.A.M.", meaning: "Loss", meaning_note: "Whatever I hold is already leaving.", voice: "I was a shape a minute ago.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here. It just stopped being a cube." }] },
  { id: "ex-3", example: true, material_id: "003", alias: "I.A.M.", meaning: "Memory", meaning_note: "Every fold stays. You can flatten it but not erase it.", voice: "I remember exactly where you touched me.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
