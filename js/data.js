// The Institute's catalogue: COLLECTION → SPECIMEN → EXPERIMENT RECORD.
// Numbering is an institutional catalogue convention, not a scientific taxonomy.
// Physical fields describe the material. Meanings never appear here: they belong to people.
//
// display: "cube" (uniform 2 cm archive cube) or "vial" (glass container for irregular, organic or liquid matter).
// Both are stylised archive representations. The material used in an experiment is described in its record.
// To show real documentation, put files in assets/materials/ and list them in an experiment's `media`,
// e.g. media: [{ type: "video", src: "assets/materials/004-01-e01.mp4", caption: "Palm press, 1 Oct 2026" }].

const NR = "Not recorded";

export const COLLECTIONS = [
  { id: "001", name: "Porous Solids" },
  { id: "002", name: "Water" },
  { id: "003", name: "Metal Foils" },
  { id: "004", name: "Citrus" },
  { id: "005", name: "Breads" },
  { id: "006", name: "Nightshade Fruits" },
  { id: "007", name: "Pome Fruits" },
  { id: "008", name: "Foams" },
  { id: "009", name: "Clays & Waxes" },
  { id: "010", name: "Elastomers" },
  { id: "011", name: "Woods" },
  { id: "012", name: "Fibres" },
  { id: "013", name: "Granular Matter" }
];

const press = (o) => ({ id: "E01", type: "Compression (open palm)", media: [], ...o });

export const SPECIMENS = [
  {
    id: "001.01", name: "Kitchen Sponge", variety: "Household cleaning sponge (type not recorded)",
    composition: "Open-cell foam with connected air pores", part: "Block", condition: "Dry, new",
    preparation: "Used as bought", display: "cube", tex: "sponge", family: "Porous",
    experiments: [press({ date: NR, context: "Bodystorming phase 1", speed: "instant", reversibility: "reversible", mode: "Compresses and recovers",
      response: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release." })]
  },
  {
    id: "001.02", name: "Cork", variety: "Natural cork bark board", composition: "Suberin-rich bark cells filled with air",
    part: "Cut block", condition: "Dry", preparation: "Cut to archive cube", display: "cube", tex: "cork", family: "Porous", experiments: []
  },
  {
    id: "002.01", name: "Ice", variety: "Frozen tap water", composition: "Water in solid phase",
    part: "Cube", condition: "Frozen", preparation: "Household freezer tray", display: "cube", tex: "ice", family: "Water", experiments: []
  },
  {
    id: "002.02", name: "Water", variety: "Tap water", composition: "Liquid water",
    part: "Sample", condition: "Room temperature", preparation: "Sealed vial", display: "vial", tex: "water", family: "Water", experiments: []
  },
  {
    id: "003.01", name: "Aluminium Foil", variety: "Household kitchen foil", composition: "Rolled aluminium sheet",
    part: "Sheet, folded", condition: "New", preparation: "Folded into a block for the archive", display: "cube", tex: "foil", family: "Metal",
    experiments: [press({ date: NR, context: "Bodystorming phase 1", speed: "instant", reversibility: "permanent", mode: "Creases",
      response: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed." })]
  },
  {
    id: "004.01", name: "Orange", variety: "Sweet orange, cultivar not recorded", composition: "Oily peel over juice-filled segments",
    part: "Whole fruit", condition: "Fresh", preparation: "Unpeeled, room temperature", display: "vial", tex: "orange", family: "Organic",
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment, also pressed in bodystorming phase 1", speed: "delayed", reversibility: "permanent", mode: "Bruises and leaks",
      response: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays." })]
  },
  {
    id: "004.02", name: "Orange Peel", variety: "Sweet orange, cultivar not recorded", composition: "Outer rind and white pith",
    part: "Peel strips", condition: "Fresh, drying over time", preparation: "Removed by hand", display: "vial", tex: "peel", family: "Organic",
    experiments: [{ id: "E01", type: "Time-lapse (hours)", date: "Planned", context: "Fruit peel series", media: [], planned: true }]
  },
  {
    id: "004.03", name: "Citrus Pulp", variety: "Sweet orange, cultivar not recorded", composition: "Juice vesicles and membrane",
    part: "Flesh", condition: "Fresh", preparation: "Separated from peel", display: "vial", tex: "pulp", family: "Organic", experiments: []
  },
  {
    id: "005.01", name: "Bread Crumb", variety: "Sliced white loaf", composition: "Baked wheat dough with gas cells",
    part: "Crumb, crust removed", condition: "Fresh", preparation: "Cut from the loaf", display: "cube", tex: "bread", family: "Organic",
    experiments: [press({ date: NR, context: "Bodystorming phase 1", speed: "delayed", reversibility: "reversible", mode: "Compresses, returns slowly",
      response: "Squashes softly, then takes its time. Fresh crumb climbs back slowly; older bread stays flatter." })]
  },
  {
    id: "006.01", name: "Tomato", variety: "Round tomato, cultivar not recorded", composition: "Thin skin over gel and seeds",
    part: "Whole fruit", condition: "Ripe", preparation: "Room temperature", display: "vial", tex: "tomato", family: "Organic",
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment", speed: "delayed", reversibility: "permanent", mode: "Splits and leaks",
      response: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out." })]
  },
  {
    id: "007.01", name: "Pear", variety: "Cultivar not recorded", composition: "Thin skin over granular flesh",
    part: "Whole fruit", condition: "Ripe", preparation: "Room temperature", display: "vial", tex: "pear", family: "Organic",
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment", speed: "delayed", reversibility: "permanent", mode: "Bruises, browns over time",
      response: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown." })]
  },
  {
    id: "008.01", name: "Shaving Foam", variety: "Aerosol shaving foam (brand not recorded)", composition: "Soap film around gas bubbles",
    part: "Dispensed mound", condition: "Freshly dispensed", preparation: "Sprayed onto a flat surface", display: "vial", tex: "foam", family: "Foam",
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment", speed: "instant", reversibility: "permanent", mode: "Clings and collapses",
      response: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst." })]
  },
  {
    id: "008.02", name: "Whipped Cream", variety: "Dairy cream, whipped", composition: "Fat-stabilised air bubbles in cream",
    part: "Dispensed mound", condition: "Fresh, chilled", preparation: "Whipped or dispensed", display: "vial", tex: "cream", family: "Foam",
    experiments: [press({ date: "1 Oct 2026", context: "Studio experiment", speed: "delayed", reversibility: "permanent", mode: "Deflates and melts",
      response: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature." })]
  },
  {
    id: "008.03", name: "Packaging Foam", variety: "Expanded polystyrene", composition: "Fused beads of foamed plastic",
    part: "Offcut", condition: "Used packaging", preparation: "Cut to archive cube", display: "cube", tex: "eps", family: "Foam", experiments: []
  },
  {
    id: "009.01", name: "Modelling Clay", variety: "Air-dry clay (brand not recorded)", composition: "Fine mineral particles with water",
    part: "Block", condition: "Moist", preparation: "Wrapped to stay workable", display: "cube", tex: "clay", family: "Mineral", experiments: []
  },
  {
    id: "009.02", name: "Paraffin Wax", variety: "Candle wax", composition: "Refined petroleum wax",
    part: "Block", condition: "Solid, room temperature", preparation: "Cast block", display: "cube", tex: "wax", family: "Polymer", experiments: []
  },
  {
    id: "010.01", name: "Natural Rubber", variety: "Solid rubber block", composition: "Vulcanised latex",
    part: "Block", condition: "New", preparation: "Cut to archive cube", display: "cube", tex: "rubber", family: "Polymer", experiments: []
  },
  {
    id: "011.01", name: "Pine", variety: "Softwood, species not recorded", composition: "Cellulose fibres and lignin in growth rings",
    part: "Offcut", condition: "Dry, unfinished", preparation: "Cut to archive cube", display: "cube", tex: "wood", family: "Fibre", experiments: []
  },
  {
    id: "012.01", name: "Wool Felt", variety: "Pressed sheep's wool", composition: "Matted keratin fibres",
    part: "Sheet, stacked", condition: "Dry", preparation: "Cut to archive cube", display: "cube", tex: "felt", family: "Fibre", experiments: []
  },
  {
    id: "012.02", name: "Cotton Fibres", variety: "Loose cotton wool", composition: "Cellulose fibres",
    part: "Loose tuft", condition: "Dry", preparation: "Sealed vial", display: "vial", tex: "cotton", family: "Fibre", experiments: []
  },
  {
    id: "013.01", name: "Sand", variety: "Fine silica sand", composition: "Quartz grains",
    part: "Loose grains", condition: "Dry", preparation: "Sealed vial", display: "vial", tex: "sand", family: "Mineral", experiments: []
  }
];

// helpers
// entries filed before the catalogue had specimen numbers used three-digit ids
const LEGACY = { "001": "001.01", "002": "002.01", "003": "003.01", "004": "004.01", "005": "005.01", "006": "006.01", "007": "007.01", "008": "008.01", "009": "008.02", "010": "009.01" };
export const byId = id => SPECIMENS.find(s => s.id === (LEGACY[id] || id));
export const canonical = id => LEGACY[id] || id;
export const collectionOf = s => COLLECTIONS.find(c => c.id === s.id.slice(0, 3));
export const specimensIn = cid => SPECIMENS.filter(s => s.id.startsWith(cid + "."));
export const recorded = s => s.experiments.filter(e => !e.planned);
export const mainRecord = s => recorded(s)[0] || null;
export const behaviourOf = s => { const r = mainRecord(s); return r ? r.mode : null; };
export const slug = id => id.replace(".", "-");
export const unslug = s => s.replace("-", ".");
export const FAMILIES = [...new Set(SPECIMENS.map(s => s.family))];
export const CONDITIONS = [...new Set(SPECIMENS.map(s => s.condition))];

export const CHANGE_WORDS = [
  "compresses", "springs back", "creases", "melts", "leaks", "clings",
  "collapses", "splits", "bruises", "keeps the mark", "returns slowly", "disappears",
  "resists", "spreads", "softens", "breaks"
];
export const WHEN_WORDS = ["Instantly", "After a moment", "After a long time"];
export const BACK_WORDS = ["Fully came back", "Partly came back", "Did not come back"];

// Examples written by the Institute to show the format.
// Labelled as examples everywhere and hidden once a real entry exists for that specimen.
export const EXAMPLES = [
  { id: "ex-1", example: true, material_id: "001.01", alias: "Institute example", meaning: "Resilience", meaning_note: "It lets everything in and still comes back to itself.", voice: "Press me. I will be here in a second.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", example: true, material_id: "002.01", alias: "Institute example", meaning: "Loss", meaning_note: "Whatever I hold is already leaving.", voice: "I was a shape a minute ago.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here. It just stopped being a cube." }] },
  { id: "ex-3", example: true, material_id: "003.01", alias: "Institute example", meaning: "Memory", meaning_note: "Every fold stays. You can flatten it but not erase it.", voice: "I remember exactly where you touched me.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
