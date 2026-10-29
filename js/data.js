// The founding collection: Lynn's 11 materials.
// Every text comes from the project's own sources, never from guesswork:
//   v0.1 / v0.2   earlier site records (definition, mode, speed, reversibility, specimen, experiments)
//   Identity      Identity Cards I01 to I06 (physical characteristics, material response, possible identity)
//   Response      Response Cards R01 to R05 (the material language)
// A field that was never recorded stays empty, and the page shows it as missing.
//
// id       stable identifier, never reused (used in addresses and saved entries)
// no       catalogue number shown on the page
// shape    placeholder outline until a real photograph exists: "cube" | "vial" | "stand"
// photo    true when assets/materials/<id>.jpg exists (square, real photograph)
// photo/refImage  refImage marks a reference image from Lynn's exhibition board, shown for layout, not a specimen photograph
// details  close-ups { label, src }; size  height from the board
// media    documented observations, e.g. { type: "video" | "image", src: "assets/materials/004-during.mp4", caption: "During" }

const NR = "Not recorded";
const press = o => ({ id: "E01", type: "Compression (open palm)", ...o });

// R01 to R05: the material language (Response Cards, wording as approved 13 Oct 2026)
export const LANGUAGE = {
  retain: { word: "Retain", physical: "The material keeps its altered shape after the external force is removed.", human: "Carrying what happened", voice: "I can't just go back to how things were." },
  recover: { word: "Recover", physical: "The material gradually returns towards its original form after pressure is released.", human: "Regaining balance, needing time", voice: "Give me a moment, I'll be back." },
  collapse: { word: "Collapse", physical: "The material loses its original structure or volume under pressure.", human: "Feeling overwhelmed, unable to hold everything together", voice: "I can't keep everything together anymore." },
  stick: { word: "Stick", physical: "The material remains attached to a contacting surface and resists separation.", human: "Attachment, reluctance to let go", voice: "I'm not ready to let go." },
  rupture: { word: "Rupture", physical: "The material's internal structure breaks or separates under applied force.", human: "Hidden vulnerability, being affected beneath the surface", voice: "You can't always see what has changed inside me." }
};

export const FOUNDING = [
  { id: "001", no: "001", name: "Sponge", type: "Cleaning sponge", group: "Porous Solids", shape: "cube", tex: "sponge",
    response: "Compresses under pressure and returns towards its original shape after release. Recovery speed varies.",
    traits: "Porous · Compressible · Flexible · Elastic",
    identity: { name: "The Adapter", note: "Flexible and resilient, able to adjust and recover after pressure.", card: "I05" },
    words: ["recover"], speed: "instant", after: "returns", mode: "Compresses and recovers",
    def: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    specimen: { name: "Kitchen Sponge", variety: "Household cleaning sponge (type not recorded)", composition: "Open-cell foam with connected air pores", part: "Block", condition: "Dry, new", preparation: "Used as bought" },
    experiments: [press({ date: NR, context: "Bodystorming phase 1" })], media: [] },
  { id: "002", no: "002", name: "Ice", type: "Frozen tap water", group: "Water", shape: "cube", tex: "ice",
    response: "Gradually melts when exposed to warmth. May crack or fracture under sufficient force.", responseExpected: true,
    traits: "Cold · Solid · Rigid · Temperature-sensitive",
    identity: { name: "The Slow Transformer", note: "Appears still and unchanging, but gradually transforms in response to its environment.", card: "I06" },
    words: [], speed: "delayed", after: "keeps", mode: "Melts",
    def: "Resists a press at first. Warmth from the hand slowly turns its surface to water; the shape that leaves does not come back without the freezer.",
    note: "Not yet filmed by the Institute.",
    specimen: { name: "Ice", variety: "Frozen tap water", composition: "Water in solid phase", part: "Cube", condition: "Frozen", preparation: "Household freezer tray" },
    experiments: [], media: [] },
  { id: "003", no: "003", name: "Aluminium Foil", type: "Household kitchen foil", group: "Metal Foils", shape: "stand", tex: "foil",
    response: "Creases and deforms under pressure, retaining its altered shape after release.",
    traits: "Thin · Flexible · Foldable · Metallic",
    identity: { name: "The One Who Remembers", note: "Holds on to experiences and carries traces of past interactions.", card: "I02" },
    words: ["retain"], speed: "instant", after: "keeps", mode: "Creases",
    def: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    specimen: { name: "Aluminium Foil", variety: "Household kitchen foil", composition: "Rolled aluminium sheet", part: "Sheet, folded", condition: "New", preparation: "Folded into a block for the archive" },
    experiments: [press({ date: NR, context: "Bodystorming phase 1" })], media: [] },
  { id: "004", photo: true, cutout: true, refImage: true, size: "85 mm", details: [{ label: "Surface", src: "assets/materials/004-d1.jpg" }, { label: "Peel", src: "assets/materials/004-d2.jpg" }, { label: "Juice", src: "assets/materials/004-d3.jpg" }],
    no: "004", name: "Orange", type: "Sweet orange, cultivar not recorded", group: "Citrus", shape: "vial", tex: "orange",
    response: "Develops dents or pressure marks when squeezed. Changes beneath the surface may not be immediately visible.",
    traits: "Firm, textured peel · Rounded shape · Soft interior",
    identity: { name: "The Quiet Endurer", note: "Appears strong and composed, but may be affected beneath the surface.", card: "I01" },
    words: [], speed: "delayed", after: "keeps", mode: "Bruises and leaks",
    def: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays.",
    note: "Pressed 1 Oct 2026 and in bodystorming phase 1.",
    specimen: { name: "Orange", variety: "Sweet orange, cultivar not recorded", composition: "Oily peel over juice-filled segments", part: "Whole fruit", condition: "Fresh", preparation: "Unpeeled, room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment, also pressed in bodystorming phase 1" })], media: [] },
  { id: "006", photo: true, cutout: true, refImage: true, size: "70 mm", details: [{ label: "Surface", src: "assets/materials/006-d1.jpg" }, { label: "Texture", src: "assets/materials/006-d2.jpg" }, { label: "Interior", src: "assets/materials/006-d3.jpg" }],
    no: "005", name: "Tomato", type: "Round tomato, cultivar not recorded", group: "Nightshade Fruits", shape: "vial", tex: "tomato",
    response: "Deforms under pressure. Stronger force may cause lasting damage to its skin or internal structure.",
    traits: "Thin skin · Soft flesh · Fluid-filled interior",
    identity: { name: "The Sensitive One", note: "Easily affected by external pressure, even when the damage is not immediately visible.", card: "I04" },
    words: [], speed: "delayed", after: "keeps", mode: "Splits and leaks",
    def: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Tomato", variety: "Round tomato, cultivar not recorded", composition: "Thin skin over gel and seeds", part: "Whole fruit", condition: "Ripe", preparation: "Room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" }), { id: "E02", type: "Pinch, press, squeeze", date: "Not recorded", context: "Workshop B, video 02" }],
    media: [{ type: "video", src: "assets/materials/006-workshop-b-02.mp4", poster: "assets/materials/006-workshop-b-02.jpg", caption: "Workshop B 02", chapters: [["Pinch", 0], ["Press", 12], ["Squeeze", 28]] }] },
  { id: "007", photo: true, cutout: true, refImage: true, size: "110 mm", details: [{ label: "Stem", src: "assets/materials/007-d1.jpg" }, { label: "Skin", src: "assets/materials/007-d2.jpg" }, { label: "Flesh", src: "assets/materials/007-d3.jpg" }],
    no: "006", name: "Pear", type: "Cultivar not recorded", group: "Pome Fruits", shape: "vial", tex: "pear",
    response: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.",
    words: [], speed: "delayed", after: "keeps", mode: "Bruises, browns over time",
    def: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Pear", variety: "Cultivar not recorded", composition: "Thin skin over granular flesh", part: "Whole fruit", condition: "Ripe", preparation: "Room temperature" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })], media: [] },
  { id: "008", no: "007", name: "Shaving Foam", type: "Aerosol shaving foam", group: "Foams", shape: "vial", tex: "foam",
    response: "Collapses under pressure, sticks to the hand and resists separation.",
    traits: "Soft · Airy · Lightweight · Sticky",
    identity: { name: "The Clingy One", note: "Becomes attached easily and struggles to let go.", card: "I03" },
    words: ["collapse", "stick"], speed: "instant", after: "keeps", mode: "Clings and collapses",
    def: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Shaving Foam", variety: "Aerosol shaving foam (brand not recorded)", composition: "Soap film around gas bubbles", part: "Dispensed mound", condition: "Freshly dispensed", preparation: "Sprayed onto a flat surface" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })], media: [] },
  { id: "009", photo: true, cutout: true, refImage: true, size: "40 mm", details: [{ label: "Foam", src: "assets/materials/009-d1.jpg" }, { label: "Texture", src: "assets/materials/009-d2.jpg" }, { label: "Surface", src: "assets/materials/009-d3.jpg" }],
    no: "008", name: "Cream", type: "Whipped dairy cream", group: "Foams", shape: "vial", tex: "cream",
    response: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
    words: [], speed: "delayed", after: "keeps", mode: "Deflates and melts",
    def: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
    note: "Pressed 1 Oct 2026.",
    specimen: { name: "Whipped Cream", variety: "Dairy cream, whipped", composition: "Fat-stabilised air bubbles in cream", part: "Dispensed mound", condition: "Fresh, chilled", preparation: "Whipped or dispensed" },
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment" })], media: [] },
  { id: "012", no: "009", name: "Rose", shape: "stand", tex: "rose", words: [],
    note: "Pressed on camera in the trace experiments (midterm presentation, 23 Oct 2026). Observation not yet written.",
    experiments: [], media: [] },
  { id: "013", no: "010", name: "Cabbage Leaf", shape: "stand", tex: "cabbage", words: [], experiments: [], media: [] },
  { id: "014", no: "011", name: "Madeleine", shape: "stand", tex: "madeleine", words: [], experiments: [], media: [] }
];

// Earlier archive entries that are not in the founding collection. Kept so their records and any saved meanings still resolve.
export const RETIRED = [
  { id: "005", no: "—", name: "Bread", retired: true, shape: "cube", words: [], speed: "delayed", after: "returns", mode: "Compresses, returns slowly",
    def: "Squashes softly, then takes its time. Fresh crumb climbs back slowly; older bread stays flatter.", note: "Pressed in bodystorming phase 1 (Sept 2026).", experiments: [], media: [] },
  { id: "010", no: "—", name: "Clay", retired: true, shape: "cube", words: [], speed: "instant", after: "keeps", mode: "Takes the shape",
    def: "Records the press exactly, down to the lines of the palm, and keeps it until someone reshapes it.", note: "Not yet filmed by the Institute.", experiments: [], media: [] },
  { id: "011", no: "—", name: "Gel", retired: true, shape: "cube", words: [], experiments: [], media: [] }
];

export const SPEEDS = { instant: "Instant", delayed: "Delayed" };
export const AFTERS = { returns: "Returns toward first shape", keeps: "Keeps the change" };

// community materials are added at runtime (see store.js)
let community = [];
export const setCommunity = list => {
  community = [...list].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((c, i) => ({ ...c, no: String(FOUNDING.length + 1 + i).padStart(3, "0"), community: true, shape: "stand", tex: "community", words: [], experiments: [], media: [] }));
};
export const allMaterials = () => [...FOUNDING, ...community];

// ids from earlier versions of the site
const LEGACY = { "001.01": "001", "002.01": "002", "003.01": "003", "004.01": "004", "005.01": "005", "006.01": "006", "007.01": "007", "008.01": "008", "008.02": "009", "009.01": "010" };
export const canonical = id => LEGACY[id] || id;
export const byId = id => allMaterials().find(m => m.id === canonical(id)) || RETIRED.find(m => m.id === canonical(id));

// Demo interpretations, written by Claude for site v0.1 to show the format. Not research evidence and not the Institute's view.
export const DEMOS = [
  { id: "ex-1", demo: true, material_id: "001", alias: "Demo", meaning: "Resilience", meaning_note: "It lets everything in and still comes back to itself.", voice: "Press me. I will be here in a second.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", demo: true, material_id: "002", alias: "Demo", meaning: "Loss", meaning_note: "Whatever I hold is already leaving.", voice: "I was a shape a minute ago.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here. It just stopped being a cube." }] },
  { id: "ex-3", demo: true, material_id: "003", alias: "Demo", meaning: "Memory", meaning_note: "Every fold stays. You can flatten it but not erase it.", voice: "I remember exactly where you touched me.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
