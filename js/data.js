// The founding collection: 11 materials.
// Each entry reads like a dictionary entry: the Institute's definition of what the material does,
// its word in the material language, and a way to say it with the body. Human meanings live in entries, not here.
// display: "cube" or "vial". To use a real photo, add assets/materials/<id>.jpg and set photo: true.

export const FOUNDING = [
  { id: "001", name: "Sponge", kind: "Porous solid", display: "cube", tex: "sponge",
    def: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release.",
    word: "springs back", speed: "instant", after: "returns", body: "Drop low at once, then rise back up.",
    madeOf: "Open-cell foam with connected air pores", record: "Pressed in bodystorming phase 1, Sept 2026." },
  { id: "002", name: "Ice", kind: "Frozen water", display: "cube", tex: "ice",
    def: "Resists a press at first. Warmth from the hand slowly turns its surface to water; the shape that leaves does not come back without the freezer.",
    word: "melts away", speed: "slow", after: "stays", body: "Stand still and hard, then slowly soften to the floor.",
    madeOf: "Water in solid phase", record: "Not yet tested by the Institute." },
  { id: "003", name: "Aluminium Foil", kind: "Metal sheet", display: "cube", tex: "foil",
    def: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed.",
    word: "keeps the crease", speed: "instant", after: "stays", body: "Fold sharply at the joints and hold the shape.",
    madeOf: "Rolled aluminium sheet", record: "Pressed in bodystorming phase 1, Sept 2026." },
  { id: "004", name: "Orange", kind: "Citrus fruit", display: "vial", tex: "orange",
    def: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays.",
    word: "bruises and leaks", speed: "slow", after: "stays", body: "Hold firm, give way slowly, let the arms open.",
    madeOf: "Oily peel over juice-filled segments", record: "Pressed 1 Oct 2026 and in bodystorming phase 1." },
  { id: "005", name: "Bread", kind: "Baked dough", display: "cube", tex: "bread",
    def: "Squashes softly, then takes its time. Fresh crumb climbs back slowly; older bread stays flatter.",
    word: "returns slowly", speed: "slow", after: "returns", body: "Sink softly, then take a long time to stand again.",
    madeOf: "Baked wheat dough with gas cells", record: "Pressed in bodystorming phase 1, Sept 2026." },
  { id: "006", name: "Tomato", kind: "Fruit", display: "vial", tex: "tomato",
    def: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out.",
    word: "splits", speed: "slow", after: "stays", body: "Tense the whole body, then burst open.",
    madeOf: "Thin skin over gel and seeds", record: "Pressed 1 Oct 2026." },
  { id: "007", name: "Pear", kind: "Fruit", display: "vial", tex: "pear",
    def: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.",
    word: "bruises later", speed: "slow", after: "stays", body: "Take the press without moving, then slowly fold inward.",
    madeOf: "Thin skin over granular flesh", record: "Pressed 1 Oct 2026." },
  { id: "008", name: "Shaving Foam", kind: "Foam", display: "vial", tex: "foam",
    def: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst.",
    word: "clings and collapses", speed: "instant", after: "stays", body: "Flatten, reach after the hand, then sink.",
    madeOf: "Soap film around gas bubbles", record: "Pressed 1 Oct 2026." },
  { id: "009", name: "Cream Foam", kind: "Foam", display: "vial", tex: "cream",
    def: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
    word: "deflates and melts", speed: "slow", after: "stays", body: "Keep a soft shape, take the print, then melt down.",
    madeOf: "Fat-stabilised air bubbles in cream", record: "Pressed 1 Oct 2026." },
  { id: "010", name: "Clay", kind: "Mineral paste", display: "cube", tex: "clay",
    def: "Records the press exactly, down to the lines of the palm, and keeps it until someone reshapes it.",
    word: "takes the shape", speed: "instant", after: "stays", body: "Let the press push you into a new shape and stay there.",
    madeOf: "Fine mineral particles with water", record: "Not yet tested by the Institute." },
  { id: "011", name: "Gel", kind: "Soft solid", display: "cube", tex: "gel",
    def: "Wobbles under pressure, spreads a little, then settles back to its shape when released.",
    word: "wobbles back", speed: "instant", after: "returns", body: "Sway with the press, then settle back to centre.",
    madeOf: "Water held in a soft polymer network", record: "Not yet tested by the Institute." }
];

// the material language: how fast it changes, and whether it comes back
export const SPEEDS = { instant: "Instant", slow: "Slow" };
export const AFTERS = { returns: "Comes back", stays: "Stays changed" };

// community materials are added at runtime (see store.js)
let community = [];
export const setCommunity = list => {
  community = [...list].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((c, i) => ({ ...c, no: String(FOUNDING.length + 1 + i).padStart(3, "0"), def: c.note || "", kind: "Community submission", community: true, display: "cube", tex: "community" }));
};
export const allMaterials = () => [...FOUNDING, ...community];

// ids from earlier versions of the site
const LEGACY = { "001.01": "001", "002.01": "002", "003.01": "003", "004.01": "004", "005.01": "005", "006.01": "006", "007.01": "007", "008.01": "008", "008.02": "009", "009.01": "010" };
export const canonical = id => LEGACY[id] || id;
export const byId = id => allMaterials().find(m => m.id === canonical(id));

// Examples written by the Institute to show the format.
// Labelled as examples and hidden once a real entry exists for that material.
export const EXAMPLES = [
  { id: "ex-1", example: true, material_id: "001", alias: "Example", meaning: "Resilience", meaning_note: "It lets everything in and still comes back.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", example: true, material_id: "002", alias: "Example", meaning: "Loss", meaning_note: "Whatever it holds is already leaving.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here." }] },
  { id: "ex-3", example: true, material_id: "003", alias: "Example", meaning: "Memory", meaning_note: "You can flatten it but not erase it.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
