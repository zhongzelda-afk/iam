// Specimen display.
// A specimen is shown by a real photograph (photo: true in data.js, file assets/materials/<id>.jpg).
// Until one exists, a thin technical outline of its display vessel stands in, clearly labelled as pending.
// No drawn or textured stand-ins for the material itself.

const f = n => n.toFixed(1);
const LINE = "#8C9997";

// ---------- small logo mark ----------
export function mark(color = "#C77B85") {
  let d = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    d += `<ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(${f(a * 180 / Math.PI)} 12 12)" fill="none" stroke="${color}" stroke-width=".5"/>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${d}<circle cx="12" cy="12" r="2" fill="${color}"/></svg>`;
}

// ---------- vessel outlines (placeholder only) ----------
const VESSEL = {
  // glass display cube
  cube: `<path d="M62 78 H130 V146 H62 Z M62 78 L76 66 H144 L130 78 M144 66 V134 L130 146"/>`,
  // contemporary specimen vial with a flat lid
  vial: `<path d="M74 70 H126 M76 70 V150 Q76 156 82 156 H118 Q124 156 124 150 V70"/><path d="M72 62 H128 V70 H72 Z"/>`,
  // minimal stand: disc and pin
  stand: `<ellipse cx="100" cy="148" rx="34" ry="5"/><path d="M100 148 V112"/><circle cx="100" cy="108" r="3"/>`
};

function vessel(shape = "stand", strong = false) {
  return `<svg class="vessel" viewBox="0 0 200 200" aria-hidden="true">
    <g fill="none" stroke="${LINE}" stroke-width=".75" stroke-opacity="${strong ? .55 : .3}" vector-effect="non-scaling-stroke">${VESSEL[shape] || VESSEL.stand}</g>
  </svg>`;
}

// the technical field drawn around every specimen: corner registration marks, a dotted centre guide, a ruled baseline
export function field() {
  const corner = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 10} V${y} H${x + dx * 10}"/>`;
  let ticks = "";
  for (let i = 0; i <= 20; i++) { const x = 30 + i * 7; ticks += `<path d="M${x} 168 V${i % 5 ? 171 : 174}"/>`; }
  return `<svg class="field" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
    <g fill="none" stroke="${LINE}" stroke-width=".5" vector-effect="non-scaling-stroke">
      <g stroke-opacity=".35">${corner(8, 8, 1, 1)}${corner(192, 8, -1, 1)}${corner(8, 192, 1, -1)}${corner(192, 192, -1, -1)}</g>
      <g stroke-opacity=".14" stroke-dasharray="1 3"><path d="M100 14 V186"/><path d="M14 100 H186"/></g>
      <g stroke-opacity=".3"><path d="M30 168 H170"/>${ticks}</g>
    </g>
  </svg>`;
}

// ---------- public ----------
export function specimenArt(m, { large = false } = {}) {
  if (!m) return "";
  if (m.photo) return `<img class="photo" src="assets/materials/${m.id}.jpg" alt="${m.name}" loading="lazy" decoding="async">`;
  return `<div class="pending">${vessel(m.shape, large)}<span class="pending-label">Photograph pending</span></div>`;
}

export const emptySlot = () => `<div class="pending empty-vessel">${vessel("vial")}</div>`;

export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#151515"/>${mark().replace(/<\/?svg[^>]*>/g, "")}</svg>`;
