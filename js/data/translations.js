// Public material translations shown on Material Detail pages.
// PROVENANCE RULES
//   WORKSHOP_PARTICIPANT  words said by workshop participants, as recorded by Lynn
//   PUBLIC_CONTRIBUTION   a visitor's translation, approved by Lynn (loaded from Supabase, never typed here)
//   CREATIVE_SIMULATION   written to illustrate, never by a participant. Must be labelled on screen.
//   IAM_TRANSLATION       written by Lynn as the Institute (I.A.M.), from watching the experiment videos
//   MIXED_WORKSHOP        a set where some lines are Lynn's and some were said by participants, and it
//                         was not recorded which line is whose. Shown as a shared credit, never split by guess.
// Never add a statement here as WORKSHOP_PARTICIPANT unless a participant actually said it.
//
// Orange T-001 to T-004: Lynn's State Booklet texts (3 Nov 2026), "Source: participants / Material Library".
// T-005 to T-028: Lynn's texts sent 6 Nov 2026 (four per object, her T01 to T04), not tied to a state.
// Ice and Cream Foam (T-013..T-016, T-021..T-024): Lynn says four of these eight lines came from
// participants Olivia and Rena (first names only, her choice) but she does not remember which four.
// state = the physical state the translation is attached to in the booklet.

export const SOURCE_TYPES = {
  WORKSHOP_PARTICIPANT: "Workshop participant",
  PUBLIC_CONTRIBUTION: "Public contribution",
  CREATIVE_SIMULATION: "Creative simulation, not participant data",
  IAM_TRANSLATION: "I.A.M. translation, written by the researcher",
  MIXED_WORKSHOP: "Researcher and workshop participants, line by line credit not recorded"
};

export const TRANSLATIONS = [
  { id: "T-001", materialSlug: "orange", action: "Compression", state: "02", text: "You keep challenging me… No!!!", sourceType: "WORKSHOP_PARTICIPANT", sourceLabel: "Participants · Material Library", createdAt: null },
  { id: "T-002", materialSlug: "orange", action: "Compression", state: "03", text: "I don't want to show the person I'm broken…", sourceType: "WORKSHOP_PARTICIPANT", sourceLabel: "Participants · Material Library", createdAt: null },
  { id: "T-003", materialSlug: "orange", action: "Compression", state: "03", text: "Adapting to form. A state of fluid harmony.", sourceType: "WORKSHOP_PARTICIPANT", sourceLabel: "Participants · Material Library", createdAt: null },
  { id: "T-004", materialSlug: "orange", action: "Compression", state: "04", text: "Yes I'm … I don't care.", sourceType: "WORKSHOP_PARTICIPANT", sourceLabel: "Participants · Material Library", createdAt: null },
  { id: "T-005", materialSlug: "aluminium-foil", action: "Compression", state: null, text: "You barely touched me, and I've already changed.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-006", materialSlug: "aluminium-foil", action: "Compression", state: null, text: "Every time you fold me, I remember.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-007", materialSlug: "aluminium-foil", action: "Compression", state: null, text: "I used to take up so much space. Look at me now.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-008", materialSlug: "aluminium-foil", action: "Compression", state: null, text: "You can flatten me again, but the lines will still be there.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-009", materialSlug: "cleaning-sponge", action: "Compression", state: null, text: "Go on, squeeze me. I'll find my way back.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-010", materialSlug: "cleaning-sponge", action: "Compression", state: null, text: "I keep making room for you, even when there's none left.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-011", materialSlug: "cleaning-sponge", action: "Compression", state: null, text: "For a moment, I forgot what shape I was.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-012", materialSlug: "cleaning-sponge", action: "Compression", state: null, text: "You let go, and slowly, I become myself again.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-013", materialSlug: "ice", action: "Compression", state: null, text: "The longer you hold me, the less of me there is.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-014", materialSlug: "ice", action: "Compression", state: null, text: "I'm not trying to escape. I'm just melting.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-015", materialSlug: "ice", action: "Compression", state: null, text: "You think I'm cold, but your warmth is changing everything.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-016", materialSlug: "ice", action: "Compression", state: null, text: "I was solid a moment ago. Where did I go?", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-017", materialSlug: "tomato", action: "Compression", state: null, text: "I'm softer than I look. Please don't squeeze so hard.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-018", materialSlug: "tomato", action: "Compression", state: null, text: "You wanted to know what's inside me? Well, now it's everywhere.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-019", materialSlug: "tomato", action: "Compression", state: null, text: "I was doing fine until your thumb got involved.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-020", materialSlug: "tomato", action: "Compression", state: null, text: "My skin was holding everything together. Not anymore.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-021", materialSlug: "cream-foam", action: "Compression", state: null, text: "I'm mostly air, but you're treating me like I'm solid.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-022", materialSlug: "cream-foam", action: "Compression", state: null, text: "Just one little poke, and you've ruined my perfect swirl.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-023", materialSlug: "cream-foam", action: "Compression", state: null, text: "I'm trying to stay fluffy. Could you stop pressing?", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-024", materialSlug: "cream-foam", action: "Compression", state: null, text: "I looked so big a moment ago. Now I'm barely here.", sourceType: "MIXED_WORKSHOP", sourceLabel: "Lynn Zhong, Olivia, Rena", createdAt: "2026-11-06" },
  { id: "T-025", materialSlug: "rose", action: "Compression", state: null, text: "You call me delicate, but you never ask how much I can take.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-026", materialSlug: "rose", action: "Compression", state: null, text: "I opened myself to the world, and the first thing you did was touch me.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-027", materialSlug: "rose", action: "Compression", state: null, text: "Please don't mistake my softness for permission.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" },
  { id: "T-028", materialSlug: "rose", action: "Compression", state: null, text: "One petal falls, but I am still here.", sourceType: "IAM_TRANSLATION", sourceLabel: "I.A.M. · Lynn Zhong", createdAt: "2026-11-06" }
];
