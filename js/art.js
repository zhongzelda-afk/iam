// Specimen display.
// A specimen is shown by a real photograph (photo: true in data.js, file assets/materials/<id>.jpg).
// Until one exists, a thin technical outline of its display vessel stands in, clearly labelled as pending.
// No drawn or textured stand-ins for the material itself.

const f = n => n.toFixed(1);
const LINE = "#A7B3BA";
const ROSE = "#B9D6E3";

// ---------- small logo mark ----------
export function mark(color = ROSE) {
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
  const corner = (x, y, dx, dy) => `<path pathLength="1" d="M${x} ${y + dy * 10} V${y} H${x + dx * 10}"/>`;
  let ticks = "";
  for (let i = 0; i <= 20; i++) { const x = 30 + i * 7; ticks += `<path d="M${x} 168 V${i % 5 ? 171 : 174}"/>`; }
  return `<svg class="sfield" viewBox="0 0 200 200" preserveAspectRatio="none" aria-hidden="true">
    <g fill="none" stroke="${LINE}" stroke-width=".5" vector-effect="non-scaling-stroke">
      <g class="cal" stroke-opacity=".35">${corner(8, 8, 1, 1)}${corner(192, 8, -1, 1)}${corner(8, 192, 1, -1)}${corner(192, 192, -1, -1)}</g>
      <g class="cal-fade" stroke-opacity=".14" stroke-dasharray="1 3"><path d="M100 14 V186"/><path d="M14 100 H186"/></g>
      <g class="cal" stroke-opacity=".3"><path pathLength="1" d="M30 168 H170"/></g><g class="cal-fade" stroke-opacity=".3">${ticks}</g>
    </g>
  </svg>`;
}

// ---------- guilloché seal ----------
// a rosette of rotated hypotrochoid bands, the Institute's engraved mark
export function guilloche({ size = 240, color = LINE } = {}) {
  const c = size / 2;
  // interwoven sinusoidal rings, each drawn several times with a small phase shift, as on engraved certificates
  const bands = [[.84, .05, 24, 12, .28], [.6, .06, 16, 10, .24], [.38, .08, 10, 8, .22]];
  let out = "";
  bands.forEach(([R, A, k, copies, op], b) => {
    for (let j = 0; j < copies; j++) {
      const ph = (j / copies) * (Math.PI * 2 / k);
      let d = "";
      for (let i = 0; i <= 240; i++) {
        const t = (i / 240) * Math.PI * 2;
        const r = c * (R + A * Math.sin(k * t + ph));
        d += `${i ? "L" : "M"}${f(c + r * Math.cos(t))} ${f(c + r * Math.sin(t))}`;
      }
      out += `<path class="g-band" pathLength="1" style="--d:${b * 160 + j * 30}ms" d="${d}Z" stroke-opacity="${op}"/>`;
    }
  });
  out += `<circle class="g-ring" pathLength="1" cx="${c}" cy="${c}" r="${f(c * .98)}"/><circle class="g-ring" pathLength="1" cx="${c}" cy="${c}" r="${f(c * .955)}"/><circle class="g-ring" pathLength="1" cx="${c}" cy="${c}" r="${f(c * .2)}"/>`;
  return `<svg class="guilloche" viewBox="0 0 ${size} ${size}" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width=".5" vector-effect="non-scaling-stroke">${out}</g><text x="${c}" y="${c + 3.5}" text-anchor="middle" font-size="${f(size * .045)}" letter-spacing=".12em" fill="${color}" fill-opacity=".8">I.A.M.</text></svg>`;
}

// ---------- homepage report composition ----------
// a measured plate around the specimens: grid, concentric survey circles, a schematic press and return curve, crosshairs, a few annotations
export function report() {
  // plate is 600 x 440; the four specimens stand in the lower band (centres at x 93, 231, 369, 507)
  const circles = [34, 54, 76, 100].map((r, i) => `<circle class="draw" pathLength="1" style="--d:${120 + i * 90}ms" cx="369" cy="318" r="${r}"/>`).join("");
  const cross = (x, y, i) => `<g class="draw-fade" style="--d:${500 + i * 80}ms"><path d="M${x - 9} ${y} H${x + 9} M${x} ${y - 9} V${y + 9}"/><circle cx="${x}" cy="${y}" r="3.5"/></g>`;
  // schematic only: pressed down quickly, then returning
  const curve = `M40 96 H128 C138 96 140 158 150 158 C176 158 192 102 262 98 H330`;
  return `<svg class="report" viewBox="0 0 600 440" aria-hidden="true">
    <g fill="none" stroke="${LINE}" stroke-width=".6" vector-effect="non-scaling-stroke">
      <g stroke-opacity=".22">${circles}</g>
      <g stroke-opacity=".2" class="draw-fade" style="--d:80ms" stroke-dasharray="2 4"><path d="M369 196 V436"/><path d="M8 232 H592"/></g>
      <g stroke-opacity=".6"><path class="draw" pathLength="1" style="--d:420ms" d="${curve}"/></g>
      <g stroke-opacity=".3" class="draw-fade" style="--d:300ms"><path d="M40 70 V176 H330"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${40 + i * 26} 176 v4"/>`).join("")}</g>
      <g stroke-opacity=".5">${cross(150, 158, 0)}${cross(560, 232, 1)}${cross(24, 420, 2)}</g>
      <path class="draw" pathLength="1" style="--d:700ms" stroke="${ROSE}" stroke-opacity=".8" d="M150 158 L178 196 H232"/>
    </g>
    <g class="draw-fade" style="--d:900ms" fill="${LINE}" font-size="8.5" letter-spacing=".1em">
      <text x="40" y="58">FIG. 01 · PRESS AND RETURN · SCHEMATIC</text>
      <text x="238" y="199" fill="${ROSE}">POINT OF CONTACT</text>
      <text x="336" y="179">TIME</text>
      <text x="476" y="226" opacity=".7">SURVEY 003</text>
    </g>
  </svg>`;
}

// ---------- public ----------
export function specimenArt(m, { large = false } = {}) {
  if (!m) return "";
  // a cutout shows the object alone, without the photograph's background
  if (m.photo) return `<img class="photo${m.cutout ? " cutout" : ""}" src="assets/materials/${m.id}${m.cutout ? "-cut.png" : ".jpg"}" alt="${m.name}" loading="lazy" decoding="async">`;
  return `<div class="pending">${vessel(m.shape, large)}<span class="pending-label">Photograph pending</span></div>`;
}

export const emptySlot = () => `<div class="pending empty-vessel">${vessel("vial")}</div>`;

export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#050505"/>${mark().replace(/<\/?svg[^>]*>/g, "")}</svg>`;
