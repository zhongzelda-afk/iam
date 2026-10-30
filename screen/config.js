// I.A.M. screen settings. Edit and reload the page.
window.IAM_SCREEN = {
  // Same public values as the website (Supabase > Project Settings > API). Read only.
  SUPABASE_URL: "https://twwmjgalfddzkxdbbwwo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_D4DXvBk4O8i18UNXUGY8Rg_PpzcqjAx",
  refreshSeconds: 60,

  // Moderation: a voice containing any of these words is never shown (case ignored).
  blocklist: [],
  // Entry ids never to show (press D on the screen to see ids of recent voices).
  hiddenIds: [],
  // When true, only the ids listed in approvedIds are shown.
  approvedOnly: false,
  approvedIds: [],

  // Heads (3D models in heads3d.js). speed: "instant" | "delayed"; after: "returns" | "keeps" (from the archive).
  materials: [
    { id: "001", name: "Sponge", speed: "instant", after: "returns" },
    { id: "002", name: "Ice", speed: "delayed", after: "keeps" },
    { id: "003", name: "Aluminium Foil", speed: "instant", after: "keeps" },
    { id: "004", name: "Orange", speed: "delayed", after: "keeps" },
    { id: "006", name: "Tomato", speed: "delayed", after: "keeps" },
    { id: "007", name: "Pear", speed: "delayed", after: "keeps" },
    { id: "008", name: "Shaving Foam", speed: "instant", after: "keeps" },
    { id: "009", name: "Cream", speed: "delayed", after: "keeps" },
    { id: "012", name: "Rose", speed: "", after: "" },
    { id: "013", name: "Cabbage Leaf", speed: "", after: "" },
    { id: "014", name: "Madeleine", speed: "", after: "" },
  ],

  maxHeads: 3,
  headScale: 1.9,      // head width relative to the distance between the ears
  headOffsetY: 0.12,   // move the head up (+) or down, relative to its size
  tilt: 1,             // follow head tilt; 0 switches it off
  squash: 0.5,         // how much the whole head flattens while pressed (0 to 1)
  pressDepth: 0.5,     // how deep a press dents the surface, relative to head size
  bulge: 0.14,         // how much the surface swells out around a press
  shadow: 1,           // soft shadow the head casts on the person (0 switches it off)
  matchLight: 0.6,     // how much the room's colour tints the heads (0 to 1)
  grain: 0.06,         // film grain over the whole picture (0 switches it off)
  // Traces: share of each press that stays on the head until the visitor leaves.
  traceKeeps: 0.45,    // materials that keep the change
  traceReturns: 0,     // materials that return to their form
  traceUnknown: 0.2,   // materials not yet observed

  handOpenRatio: 1.8,  // calibrate with the debug panel (press D)
  handFistRatio: 1.05,
  pressThreshold: 0.7,
  releaseThreshold: 0.35,
  cooldownSeconds: 1.5,

  subtitleSeconds: 7,
  sameMaterialChance: 0.75,
  showCounter: true,
  hint: "Close your hand beside your head",
  hintAfterSeconds: 6,
};
