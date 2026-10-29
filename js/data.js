// The Institute's specimen register.
// Physical notes describe what the material does. They are evidence, not meaning.
// To show real footage: put assets/materials/<id>.jpg and/or <id>.mp4 in the repo,
// then add  photo: true  and/or  video: true  to that material below.

export const MATERIALS = [
  {
    id: "001", name: "Sponge", tag: "pink",
    behaviour: "Compresses / Springs back",
    speed: "instant", reversibility: "reversible", mode: "Compresses and recovers",
    does: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    tested: true
  },
  {
    id: "002", name: "Ice", tag: "blue",
    behaviour: "Melting / Phase change",
    speed: "delayed", reversibility: "permanent", mode: "Melts",
    does: "Resists a press at first. Warmth from the hand slowly turns its surface to water; the shape that leaves does not come back without the freezer.",
    note: "Not yet filmed by the Institute.",
    tested: false
  },
  {
    id: "003", name: "Aluminium Foil", tag: "butter",
    behaviour: "Creases / Keeps the mark",
    speed: "instant", reversibility: "permanent", mode: "Creases",
    does: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    tested: true
  },
  {
    id: "004", name: "Orange", tag: "sage",
    behaviour: "Bruises later / Leaks",
    speed: "delayed", reversibility: "permanent", mode: "Bruises and leaks",
    does: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays.",
    note: "Pressed 1 Oct 2026 and in bodystorming phase 1.",
    tested: true
  },
  {
    id: "005", name: "Bread", tag: "butter",
    behaviour: "Slow return",
    speed: "delayed", reversibility: "reversible", mode: "Compresses, returns slowly",
    does: "Squashes softly, then takes its time. Fresh crumb climbs back slowly; older bread stays flatter.",
    note: "Pressed in bodystorming phase 1 (Sept 2026).",
    tested: true
  },
  {
    id: "006", name: "Tomato", tag: "pink",
    behaviour: "Splits / Leaks",
    speed: "delayed", reversibility: "permanent", mode: "Splits and leaks",
    does: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out.",
    note: "Pressed 1 Oct 2026.",
    tested: true
  },
  {
    id: "007", name: "Pear", tag: "sage",
    behaviour: "Bruises / Oxidises",
    speed: "delayed", reversibility: "permanent", mode: "Bruises, browns over time",
    does: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.",
    note: "Pressed 1 Oct 2026.",
    tested: true
  },
  {
    id: "008", name: "Shaving Foam", tag: "blue",
    behaviour: "Clings / Collapses",
    speed: "instant", reversibility: "permanent", mode: "Clings and collapses",
    does: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst.",
    note: "Pressed 1 Oct 2026.",
    tested: true
  },
  {
    id: "009", name: "Cream Foam", tag: "pink",
    behaviour: "Deflates / Melts",
    speed: "delayed", reversibility: "permanent", mode: "Deflates and melts",
    does: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
    note: "Pressed 1 Oct 2026.",
    tested: true
  },
  {
    id: "010", name: "Clay", tag: "butter",
    behaviour: "Takes the shape",
    speed: "instant", reversibility: "permanent", mode: "Takes the shape",
    does: "Records the press exactly, down to the lines of the palm, and keeps it until someone reshapes it.",
    note: "Not yet filmed by the Institute.",
    tested: false
  }
];

export const byId = id => MATERIALS.find(m => m.id === id);

export const CHANGE_WORDS = [
  "compresses", "springs back", "creases", "melts", "leaks", "clings",
  "collapses", "splits", "bruises", "keeps the mark", "returns slowly", "disappears",
  "resists", "spreads", "softens", "breaks"
];

export const WHEN_WORDS = ["Instantly", "After a moment", "After a long time"];
export const BACK_WORDS = ["Fully came back", "Partly came back", "Did not come back"];

// Examples written by the Institute to show visitors the format.
// They are labelled as examples everywhere and are hidden once real entries exist for that material.
export const EXAMPLES = [
  { id: "ex-1", example: true, material_id: "001", alias: "Institute example", meaning: "Resilience", meaning_note: "It lets everything in and still comes back to itself.", voice: "Press me. I will be here in a second.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] },
  { id: "ex-2", example: true, material_id: "002", alias: "Institute example", meaning: "Loss", meaning_note: "Whatever I hold is already leaving.", voice: "I was a shape a minute ago.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [{ at: "2026-10-30T10:00:00Z", meaning: "Transformation", note: "The water is still here. It just stopped being a cube." }] },
  { id: "ex-3", example: true, material_id: "003", alias: "Institute example", meaning: "Memory", meaning_note: "Every fold stays. You can flatten it but not erase it.", voice: "I remember exactly where you touched me.", created_at: "2026-10-29T10:00:00Z", body: null, revisions: [] }
];
