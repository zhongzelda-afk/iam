// The I.A.M. card deck, copied word for word from Lynn's Figma card pages (13 Oct 2026):
// Action v0.1, Response v0.1, Translation v0.1, Voice v0.2, Identity v0.3.
// Used by the Become a Material game. Change wording here, not in the page.

export const ACTIONS = [
  { n: "A 01", word: "Press", text: "Apply pressure downwards using your palm." },
  { n: "A 02", word: "Squeeze", text: "Compress the material from two or more sides." },
  { n: "A 03", word: "Pull", text: "Apply force away from the material or another surface." },
  { n: "A 04", word: "Twist", text: "Apply rotational force to change the material’s form." },
  { n: "A 05", word: "Release", text: "Remove the applied force and allow the material to respond without further contact." }
];

export const RESPONSES = [
  { n: "R 01", word: "Retain", voice: "I can’t just go back to how things were.", physical: "The material keeps its altered shape after the external force is removed.", human: "Carrying what happened", t: "T 01" },
  { n: "R 02", word: "Recover", voice: "Give me a moment, I’ll be back.", physical: "The material gradually returns towards its original form after pressure is released.", human: "Regaining balance / needing time", t: "T 03" },
  { n: "R 03", word: "Collapse", voice: "I can’t keep everything together anymore.", physical: "The material loses its original structure or volume under pressure.", human: "Feeling overwhelmed / unable to hold everything together", t: "T 02" },
  { n: "R 04", word: "Stick", voice: "I’m not ready to let go.", physical: "The material remains attached to a contacting surface and resists separation.", human: "Attachment / reluctance to let go", t: "T 05" },
  { n: "R 05", word: "Rupture", voice: "You can’t always see what has changed inside me.", physical: "The material’s internal structure breaks or separates under applied force.", human: "Hidden vulnerability / being affected beneath the surface", t: "T 04" }
];

// R -> T pairing follows each card's own human translation (R01 holding, R02 needing time, ...).
export const TRANSLATIONS = [
  { n: "T 01", word: "Holding", question: "What are you finding difficult to leave behind?", meaning: "Unable to let go of something." },
  { n: "T 02", word: "Overwhelmed", question: "When does everything become too much?", meaning: "Feeling that something is too much to handle." },
  { n: "T 03", word: "Needing time", question: "What do you need time to recover from?", meaning: "Requiring time to recover or adjust." },
  { n: "T 04", word: "Vulnerable", question: "Can someone be affected without showing it?", meaning: "Being affected beneath the surface." },
  { n: "T 05", word: "Attached", question: "What makes separation difficult?", meaning: "Finding it difficult to separate from someone or something." }
];

export const VOICES = [
  { n: "V 01", text: "I’m not ready to let go." },
  { n: "V 02", text: "Give me a little more time." },
  { n: "V 03", text: "Stop pushing me." },
  { n: "V 04", text: "I’m fine. Nothing happened." },
  { n: "V 05", text: "You changed me, but you didn’t notice." }
];

// Identity cards exist for six materials only. Others play without one (shown honestly).
export const IDENTITIES = {
  orange: { n: "I 01", name: "The Quiet Endurer", note: "Appears strong and composed, but may be affected beneath the surface.", physical: "Firm, textured peel · Rounded shape · Soft interior", response: "Develops dents or pressure marks when squeezed. Changes beneath the surface may not be immediately visible." },
  "aluminium-foil": { n: "I 02", name: "The One Who Remembers", note: "Holds on to experiences and carries traces of past interactions.", physical: "Thin · Flexible · Foldable · Metallic", response: "Creases and deforms under pressure, retaining its altered shape after release." },
  "shaving-foam": { n: "I 03", name: "The Clingy One", note: "Becomes attached easily and struggles to let go.", physical: "Soft · Airy · Lightweight · Sticky", response: "Collapses under pressure, sticks to the hand and resists separation." },
  tomato: { n: "I 04", name: "The Sensitive One", note: "Easily affected by external pressure, even when the damage is not immediately visible.", physical: "Thin skin · Soft flesh · Fluid-filled interior", response: "Deforms under pressure. Stronger force may cause lasting damage to its skin or internal structure." },
  "cleaning-sponge": { n: "I 05", name: "The Adapter", note: "Flexible and resilient, able to adjust and recover after pressure.", physical: "Porous · Compressible · Flexible · Elastic", response: "Compresses under pressure and returns towards its original shape after release. Recovery speed varies." },
  ice: { n: "I 06", name: "The Slow Transformer", note: "Appears still and unchanging, but gradually transforms in response to its environment.", physical: "Cold · Solid · Rigid · Temperature-sensitive", response: "Gradually melts when exposed to warmth. May crack or fracture under sufficient force.", expected: true }
};

export const MAX_ROUNDS = 5;
