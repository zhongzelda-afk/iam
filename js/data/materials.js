// I.A.M. material records. Content only, no layout.
// Sources, so nothing here is guesswork:
//   observation.response   the Institute's earlier records (site v0.1 to v1.1, Lynn's wording)
//   observation.interpretation  Lynn's Identity Cards I01 to I06
//   states[].observation   Orange only: Lynn's State Booklet texts (3 Nov 2026)
//   physicalProfile        general material description drafted for this build (4 Nov 2026), no measurements
//   video / states images  real frames from Lynn's Workshop B videos (tools/extract-assets.py)
// A field that was never recorded is null and the page says so.
//
// IMAGES: every object has a folder assets/objects/<slug>/
//   cutout.webp      gallery and hero image, cut out of Lynn's 4K studio videos and photographs
//                    (tools/extract-hd.py).
//                    To use a final photograph, save it over this file (square, transparent
//                    background, about 1200 px) or point heroImage/galleryImage to the new file,
//                    and set imageTemporary to false.
//   state-01..04.jpg  frames for the four physical states
// Objects without footage have heroImage null and show a dotted outline (outline: shape name).

const V = "assets/materials/";
const O = slug => `assets/objects/${slug}/`;
const STATE_NAMES = ["Before", "Pinched", "Pressed", "Squeezed"];
const states = (slug, times, observations = []) => times.map((t, i) => ({
  n: String(i + 1).padStart(2, "0"), name: STATE_NAMES[i], image: `${O(slug)}state-0${i + 1}.jpg`, t, observation: observations[i] || null
}));
const ACTION_APPLIED = "Pinch, press and squeeze by hand, on camera (Workshop B).";

export const MATERIALS = {
  orange: {
    name: "Orange", category: "Organic", primaryAction: "Compression",
    heroImage: O("orange") + "cutout.webp", galleryImage: O("orange") + "cutout.webp", imageTemporary: false,
    physicalProfile: {
      colour: "Orange",
      shape: "Approximately spherical with a slightly rough, dimpled peel.",
      lifespan: "Perishable · storage dependent.",
      pressure: "Surface deformation and indentation; possible rupture under sufficient force."
    },
    states: states("orange", [2, 10.5, 21, 37], [
      "The orange rests in its original form. Its peel encloses the flesh beneath, with no pressure yet applied.",
      "Fingers apply pressure to a small area of the peel. The surface begins to change shape at the point of contact.",
      "Pressure increases. The orange changes shape under the applied force. Its response becomes more visible.",
      "The orange reaches the final recorded state of compression. Its shape and surface are documented after the action."
    ]),
    experimentVideo: { src: V + "004-workshop-b.mp4", poster: V + "004-workshop-b.jpg", caption: "Workshop B · Orange · pinch, press, squeeze", description: "A hand pinches the orange between fingers and thumb, presses it with a flat palm, then grips and squeezes it. The camera is fixed on a dark table. 40 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: {
      action: ACTION_APPLIED,
      response: "Holds firm under a light press. With more force the peel gives slowly, oil and juice come out, and a soft dent stays.",
      interpretation: "Identity card I01, The Quiet Endurer: appears strong and composed, but may be affected beneath the surface. The gap between a firm outside and a change underneath is where translation starts."
    }
  },
  ice: {
    name: "Ice", category: "Frozen water", primaryAction: "Compression",
    heroImage: O("ice") + "cutout.webp", galleryImage: O("ice") + "cutout.webp", imageTemporary: false,
    physicalProfile: {
      colour: "Clear to cloudy white.",
      shape: "Irregular block with a smooth, wet surface.",
      lifespan: "Lasts only while frozen; melts at room temperature.",
      pressure: "Rigid under the hand; may crack or fracture under sufficient force. Warmth from the hand melts its surface."
    },
    states: states("ice", [0.3, 8, 27, 42]),
    experimentVideo: { src: V + "002-workshop-b-05.mp4", poster: V + "002-workshop-b-05.jpg", caption: "Workshop B 05 · Ice · pinch, press, squeeze", description: "A hand pinches a small piece of ice, presses it under a flat palm, then closes around it and squeezes. Dark table, fixed camera. 60 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: {
      action: ACTION_APPLIED,
      response: "Resists a press at first. Warmth from the hand slowly turns its surface to water; the shape that leaves does not come back without the freezer.",
      interpretation: "Identity card I06, The Slow Transformer: appears still and unchanging, but gradually transforms in response to its environment."
    }
  },
  tomato: {
    name: "Tomato", category: "Organic", primaryAction: "Compression",
    heroImage: O("tomato") + "cutout.webp", galleryImage: O("tomato") + "cutout.webp", imageTemporary: false,
    physicalProfile: {
      colour: "Red",
      shape: "Round, with smooth, taut and glossy skin.",
      lifespan: "Perishable · storage dependent.",
      pressure: "Deforms under pressure. Stronger force may cause lasting damage to its skin or internal structure."
    },
    states: states("tomato", [0.5, 4, 20, 42]),
    experimentVideo: { src: V + "006-workshop-b-02.mp4", poster: V + "006-workshop-b-02.jpg", caption: "Workshop B 02 · Tomato · pinch, press, squeeze", description: "A hand pinches the tomato, presses down on it with a flat palm, then lifts and squeezes it in the fist. Dark table, fixed camera. 51 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: {
      action: ACTION_APPLIED,
      response: "Tight skin holds the pressure until it cannot, then splits along a line and lets the inside out.",
      interpretation: "Identity card I04, The Sensitive One: easily affected by external pressure, even when the damage is not immediately visible."
    }
  },
  "cream-foam": {
    name: "Cream Foam", category: "Food foam", primaryAction: "Compression",
    heroImage: O("cream-foam") + "cutout.webp", galleryImage: O("cream-foam") + "cutout.webp", imageTemporary: false,
    physicalProfile: {
      colour: "Off white",
      shape: "Soft piped mound of folds and peaks.",
      lifespan: "Highly perishable; loses volume at room temperature.",
      pressure: "Takes a print easily, flattens and spreads, and does not recover."
    },
    states: states("cream-foam", [12, 24, 44, 58]),
    experimentVideo: { src: V + "009-workshop-b-03.mp4", poster: V + "009-workshop-b-03.jpg", caption: "Workshop B 03 · Cream foam · dispense, pinch, press, squeeze", description: "Cream is sprayed from a can onto a grey card. A hand pinches it, presses it flat with the palm, squeezes it, and the film ends on the hand covered in cream. 70 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: {
      action: ACTION_APPLIED,
      response: "Holds soft peaks, takes a print easily, then sinks and turns liquid at room temperature.",
      interpretation: null
    }
  },
  rose: {
    name: "Rose", category: "Organic", primaryAction: "Compression",
    heroImage: O("rose") + "cutout.webp", galleryImage: O("rose") + "cutout.webp", imageTemporary: false,
    physicalProfile: { colour: "Deep pink", shape: "Layered petals on a long stem.", lifespan: "Perishable; wilts within days of cutting.", pressure: null },
    states: states("rose", [0.3, 6, 28, 52]),
    experimentVideo: { src: V + "012-workshop-b-06.mp4", poster: V + "012-workshop-b-06.jpg", caption: "Workshop B 06 · Rose · pinch, press, squeeze", description: "A hand pinches the rose head, presses it with the palm, then lifts it by the stem and squeezes the petals. 63 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: { action: ACTION_APPLIED, response: null, interpretation: null }
  },
  "cabbage-leaf": {
    name: "Cabbage Leaf", category: "Organic", primaryAction: "Compression",
    heroImage: O("cabbage-leaf") + "cutout.webp", galleryImage: O("cabbage-leaf") + "cutout.webp", imageTemporary: false,
    physicalProfile: { colour: "Green leaf, pale stalk", shape: "Broad smooth leaf on a thick, crisp stalk.", lifespan: "Perishable; wilts as it dries.", pressure: null },
    states: states("cabbage-leaf", [0.3, 8, 22, 45]),
    experimentVideo: { src: V + "013-workshop-b-03-leaf.mp4", poster: V + "013-workshop-b-03-leaf.jpg", caption: "Workshop B 03 (改) · Vegetable leaf · pinch, press, squeeze", description: "A hand pinches a leaf, presses it flat with the palm, then picks it up and crushes it in the hand. 55 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: { action: ACTION_APPLIED, response: null, interpretation: null }
  },
  "aluminium-foil": {
    name: "Aluminium Foil", category: "Metal", primaryAction: "Compression", outline: "sheet",
    heroImage: O("aluminium-foil") + "cutout.webp", galleryImage: O("aluminium-foil") + "cutout.webp", imageTemporary: false,
    physicalProfile: { colour: "Silver", shape: "Thin, smooth sheet, one side brighter than the other.", lifespan: "Long lasting.", pressure: "Creases and deforms under pressure, keeping its altered shape after release." },
    states: states("aluminium-foil", [1, 11, 35, 52]),
    experimentVideo: { src: V + "foil-workshop-b.mp4", poster: V + "foil-workshop-b.jpg", caption: "Workshop B · Aluminium Foil · pinch, press, squeeze", description: "A finger pinches a flat sheet of foil, a hand folds it and presses it flat with the palm, then crushes it into a ball in the fist. Dark table, fixed camera. 62 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: { action: "Open palm press (bodystorming phase 1, Sept 2026).", response: "Folds at the lightest touch and keeps every crease. Smoothing it out leaves a map of where it was pressed.", interpretation: "Identity card I02, The One Who Remembers: holds on to experiences and carries traces of past interactions." }
  },
  "cleaning-sponge": {
    name: "Cleaning Sponge", category: "Synthetic foam", primaryAction: "Compression", outline: "block",
    heroImage: O("cleaning-sponge") + "cutout.webp", galleryImage: O("cleaning-sponge") + "cutout.webp", imageTemporary: false,
    physicalProfile: { colour: "Yellow, with a green scouring layer", shape: "Rectangular block with an open, porous surface.", lifespan: "Long lasting; wears with use.", pressure: "Compresses under pressure and returns towards its original shape after release." },
    states: states("cleaning-sponge", [1, 13, 29, 55]),
    experimentVideo: { src: V + "sponge-workshop-b.mp4", poster: V + "sponge-workshop-b.jpg", caption: "Workshop B · Cleaning Sponge · pinch, press, squeeze", description: "Fingers pinch a sponge standing on its end, a flat palm presses it down on the table, then a hand picks it up and squeezes it. Dark table, fixed camera. 65 seconds, no sound." },
    bodyPerformanceVideo: null,
    observation: { action: "Open palm press (bodystorming phase 1, Sept 2026).", response: "Gives way the moment a palm presses down, pushes air out of its pores, then rises back to almost its first shape within a second or two of release.", interpretation: "Identity card I05, The Adapter: flexible and resilient, able to adjust and recover after pressure." }
  },
  pear: {
    name: "Pear", category: "Organic", primaryAction: "Compression", outline: "pear",
    heroImage: O("pear") + "cutout.webp", galleryImage: O("pear") + "cutout.webp", imageTemporary: false,
    physicalProfile: { colour: null, shape: "Rounded base narrowing to the stem, thin skin.", lifespan: "Perishable · storage dependent.", pressure: "Looks unchanged right after a press; over the next hours the pressed area softens and browns." },
    states: [], experimentVideo: null, bodyPerformanceVideo: null,
    observation: { action: "Open palm press (studio experiment, 1 Oct 2026).", response: "Looks unchanged right after a press. Over the next hours the pressed area softens and turns brown.", interpretation: null }
  },
  "shaving-foam": {
    name: "Shaving Foam", category: "Synthetic foam", primaryAction: "Compression", outline: "mound",
    heroImage: null, galleryImage: null,
    physicalProfile: { colour: "White", shape: "Dense, airy mound.", lifespan: "Short lived; bubbles slowly collapse.", pressure: "Collapses under pressure, sticks to the hand and resists separation." },
    states: [], experimentVideo: null, bodyPerformanceVideo: null,
    observation: { action: "Open palm press (studio experiment, 1 Oct 2026).", response: "Flattens under the palm, sticks to the skin when the hand lifts, and slowly loses volume as bubbles burst.", interpretation: "Identity card I03, The Clingy One: becomes attached easily and struggles to let go." }
  },
  madeleine: {
    name: "Madeleine", category: "Baked food", primaryAction: "Compression", outline: "shell",
    heroImage: null, galleryImage: null,
    physicalProfile: { colour: "Golden brown", shape: "Small shell shaped sponge cake with a ridged top.", lifespan: "Goes stale within days.", pressure: null },
    states: [], experimentVideo: null, bodyPerformanceVideo: null,
    observation: { action: null, response: null, interpretation: null }
  }
};
