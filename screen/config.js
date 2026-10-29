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

  // Heads. speed: "instant" | "delayed"; after: "returns" | "keeps" (from the archive).
  materials: [
    { id: "001", name: "Sponge", png: "heads/001_sponge.png", speed: "instant", after: "returns" },
    { id: "002", name: "Ice", png: "heads/002_ice.png", speed: "delayed", after: "keeps" },
    { id: "003", name: "Aluminium Foil", png: "heads/003_foil.png", speed: "instant", after: "keeps" },
    { id: "004", name: "Orange", png: "heads/004_orange.png", speed: "delayed", after: "keeps" },
    { id: "006", name: "Tomato", png: "heads/006_tomato.png", speed: "delayed", after: "keeps" },
    { id: "007", name: "Pear", png: "heads/007_pear.png", speed: "delayed", after: "keeps" },
    { id: "008", name: "Shaving Foam", png: "", speed: "instant", after: "keeps" },
    { id: "009", name: "Cream", png: "heads/009_cream.png", speed: "delayed", after: "keeps" },
    { id: "012", name: "Rose", png: "", speed: "", after: "" },
    { id: "013", name: "Cabbage Leaf", png: "", speed: "", after: "" },
    { id: "014", name: "Madeleine", png: "heads/014_madeleine.png", speed: "", after: "" },
  ],

  maxHeads: 3,
  headScale: 1.9,      // head width relative to the distance between the ears
  headOffsetY: 0.12,   // move the head up (+) or down, relative to its size
  tilt: 1,             // follow head tilt; 0 switches it off
  holes: true,         // eye and mouth holes
  eyeSize: 0.3,        // relative to face width
  mouthSize: 0.48,
  keepDent: true,      // materials that "keep" stay a little squashed after each squeeze

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
