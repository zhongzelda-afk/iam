// Drawn assets: the I.A.M. seal, archive cubes, specimen vials and response diagrams.
// Every specimen drawing is a stylised archive representation, not a photograph of an experiment.

const INK = "#4A3027";

// seeded random so each specimen always draws the same way
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
const f = n => n.toFixed(1);

// ---------- guilloché seal ----------
function trochoid(R, r, d, steps, cx, cy, scale, phase = 0) {
  const turns = r / gcd(R, r), N = steps * turns, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = (R - r) * Math.cos(t + phase) + d * Math.cos(((R - r) / r) * t + phase);
    const y = (R - r) * Math.sin(t + phase) - d * Math.sin(((R - r) / r) * t + phase);
    pts.push(`${f(cx + x * scale)},${f(cy + y * scale)}`);
  }
  return "M" + pts.join("L") + "Z";
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

const sealCache = {};
export function seal({ color = "#6E302F", text = true, id = "s", hollow = false } = {}) {
  const key = color + text + id + hollow;
  if (sealCache[key]) return sealCache[key];
  const c = 100;
  const layers = [trochoid(60, 13, 30, 120, c, c, .95), trochoid(60, 13, 22, 120, c, c, .95, Math.PI / 13), trochoid(48, 11, 18, 110, c, c, .92), trochoid(35, 8, 14, 90, c, c, .9, .2)];
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2, r1 = 92, r2 = i % 6 === 0 ? 87 : 89.5;
    return `M${f(c + r1 * Math.cos(a))},${f(c + r1 * Math.sin(a))}L${f(c + r2 * Math.cos(a))},${f(c + r2 * Math.sin(a))}`;
  }).join("");
  const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="I.A.M. seal">
    <circle cx="100" cy="100" r="96" fill="none" stroke="${color}" stroke-width="1.6"/>
    <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width=".6"/>
    <circle cx="100" cy="100" r="${text ? 74 : 86}" fill="none" stroke="${color}" stroke-width=".8"/>
    <path d="${ticks}" stroke="${color}" stroke-width=".8"/>
    ${text ? `<defs><path id="sp-${id}" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/></defs>
    <text font-family="Courier Prime, monospace" font-size="10.6" letter-spacing="2" fill="${color}"><textPath href="#sp-${id}">INSTITUTE OF ANIMATE MATTER · DEPT. OF MATERIAL RESPONSES ·</textPath></text>` : ""}
    <g ${text ? `transform="translate(100 100) scale(.66) translate(-100 -100)"` : ""}>${layers.map((d, i) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${i ? .45 : .55}" opacity="${1 - i * .12}"/>`).join("")}</g>
    <circle cx="100" cy="100" r="${text ? 17 : 20}" fill="${text && !hollow ? "#FAF7EF" : "none"}" stroke="${color}" stroke-width=".8"/>
    <text x="100" y="${text ? 104 : 105}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="${text ? 12 : 14}" font-weight="600" fill="${color}">I.A.M.</text>
  </svg>`;
  return (sealCache[key] = svg);
}

// ---------- archive cube ----------
// iso cube; each face maps a 100×100 texture square onto its parallelogram
const T = {
  top: "matrix(.485 -.28 .485 .28 51.5 77)",
  left: "matrix(.485 .28 0 .56 51.5 77)",
  right: "matrix(.485 -.28 0 .56 100 105)"
};

const TEX = {
  sponge: { base: "#E3C35E", draw: (r, face) => dots(r, 46, 2.5, 8, "#B8962F", .85, face === "top" ? 1 : .8) },
  cork: { base: "#B78656", draw: r => dots(r, 220, .6, 2.2, "#7A5232", .7) + dots(r, 60, .6, 1.6, "#D9AE7E", .7) },
  ice: { base: "#D6E4E6", alpha: .72, draw: r => cracks(r, 5, "#FFFFFF", .9) + dots(r, 14, .8, 2.4, "#FFFFFF", .8, 1, true) },
  foil: { base: "#C9C9C4", draw: r => facets(r, 34) },
  bread: { base: "#F0DCAE", draw: r => dots(r, 30, 1.5, 7, "#D7BC82", .9) + dots(r, 50, .5, 1.5, "#C7A86A", .6) },
  eps: { base: "#F4F1E8", draw: r => beads(r) },
  clay: { base: "#B8775A", draw: r => smudges(r) },
  wax: { base: "#EEDFB8", alpha: .9, draw: r => swirls(r, "#FFF8E2", .55) },
  rubber: { base: "#3E3833", draw: (r, face) => face === "top" ? `<ellipse cx="38" cy="40" rx="30" ry="10" fill="#FFFFFF" opacity=".08"/>` : "" },
  wood: { base: "#D3A878", draw: (r, face) => face === "top" ? rings(r) : grain(r) },
  felt: { base: "#8F8B7A", draw: r => fibres(r, 260, "#B2AE9C", .5) + fibres(r, 120, "#6D6A5C", .45) }
};

function dots(r, n, min, max, color, op, scaleY = 1, hollow = false) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * 100, y = r() * 100, rx = min + r() * (max - min), ry = rx * (.55 + r() * .5) * scaleY;
    s += hollow ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rx)}" fill="none" stroke="${color}" stroke-width=".7" opacity="${op}"/>`
      : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${op}"/>`;
  }
  return s;
}
function cracks(r, n, color, op) {
  let s = "";
  for (let i = 0; i < n; i++) {
    let x = r() * 100, y = r() * 100, d = `M${f(x)},${f(y)}`;
    for (let k = 0; k < 4; k++) { x += (r() - .5) * 40; y += (r() - .5) * 40; d += `L${f(x)},${f(y)}`; }
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width=".8" opacity="${op}"/>`;
  }
  return s;
}
function facets(r, n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = r() * 110 - 5, y = r() * 110 - 5;
    const pts = [0, 1, 2].map(() => `${f(x + (r() - .5) * 46)},${f(y + (r() - .5) * 46)}`).join(" ");
    s += `<polygon points="${pts}" fill="${r() > .5 ? "#FFFFFF" : "#5E5E58"}" opacity="${f(.12 + r() * .3)}"/>`;
  }
  return s + cracks(r, 6, "#F7F7F2", .8);
}
function beads(r) {
  let s = "";
  for (let y = 4; y < 104; y += 9) for (let x = (y / 9) % 2 ? 4 : 8.5; x < 104; x += 9) s += `<circle cx="${f(x + (r() - .5) * 2)}" cy="${f(y + (r() - .5) * 2)}" r="${f(4 + r())}" fill="#FFFFFF" stroke="#D9D3C2" stroke-width=".7"/>`;
  return s;
}
function smudges(r) {
  let s = "";
  for (let i = 0; i < 9; i++) s += `<ellipse cx="${f(r() * 100)}" cy="${f(r() * 100)}" rx="${f(8 + r() * 14)}" ry="${f(5 + r() * 8)}" fill="${r() > .5 ? "#C88A6C" : "#A6684D"}" opacity=".5"/>`;
  const cx = 30 + r() * 40, cy = 30 + r() * 40;
  for (let k = 0; k < 6; k++) s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${4 + k * 3}" ry="${3 + k * 2.2}" fill="none" stroke="#8E5640" stroke-width=".6" opacity=".55"/>`;
  return s;
}
function swirls(r, color, op) {
  let s = "";
  for (let i = 0; i < 6; i++) { const y = r() * 100; s += `<path d="M-5,${f(y)} C30,${f(y - 12 + r() * 24)} 60,${f(y - 12 + r() * 24)} 105,${f(y + (r() - .5) * 10)}" fill="none" stroke="${color}" stroke-width="${f(2 + r() * 5)}" opacity="${op}"/>`; }
  return s;
}
function rings(r) {
  const cx = -10 + r() * 20, cy = 90 + r() * 20; let s = "";
  for (let k = 1; k < 18; k++) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(k * 8 + r() * 3)}" fill="none" stroke="#A47645" stroke-width="${f(.5 + r() * 1.2)}" opacity=".7"/>`;
  return s;
}
function grain(r) {
  let s = "";
  for (let i = 0; i < 16; i++) { const x = i * 6.5 + r() * 3; s += `<path d="M${f(x)},-2 C${f(x + (r() - .5) * 10)},35 ${f(x + (r() - .5) * 10)},65 ${f(x + (r() - .5) * 6)},102" fill="none" stroke="#A47645" stroke-width="${f(.4 + r() * 1.1)}" opacity=".65"/>`; }
  return s;
}
function fibres(r, n, color, op) {
  let s = "";
  for (let i = 0; i < n; i++) { const x = r() * 100, y = r() * 100, a = r() * Math.PI, l = 3 + r() * 7; s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + Math.cos(a) * l)}" y2="${f(y + Math.sin(a) * l)}" stroke="${color}" stroke-width=".6" opacity="${op}"/>`; }
  return s;
}

function cube(sp, uid) {
  const t = TEX[sp.tex] || TEX.clay;
  const face = (name, shade) => {
    const r = rng(sp.id + name);
    return `<g transform="${T[name]}"><g clip-path="url(#cl-${uid})">
      <rect width="100" height="100" fill="${t.base}" opacity="${t.alpha || 1}"/>${t.draw(r, name)}
      <rect width="100" height="100" fill="${shade}"/></g></g>`;
  };
  return `<svg class="specimen cube" viewBox="30 34 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sp.name}, archive cube">
    <defs><clipPath id="cl-${uid}"><rect width="100" height="100"/></clipPath>
      <radialGradient id="sh-${uid}"><stop offset="0" stop-color="${INK}" stop-opacity=".32"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="104" cy="165" rx="62" ry="13" fill="url(#sh-${uid})"/>
    ${face("left", "rgba(74,48,39,.12)")}${face("right", "rgba(74,48,39,.30)")}${face("top", "rgba(255,250,235,.16)")}
    <path d="M51.5 77 L100 49 L148.5 77 L100 105 Z M51.5 77 V133 L100 161 V105 M148.5 77 V133 L100 161" fill="none" stroke="${INK}" stroke-width=".7" stroke-linejoin="round" opacity=".55"/>
    <path d="M53 77.6 L100 104.4 L147 77.6" fill="none" stroke="#FFFDF4" stroke-width=".9" opacity=".7"/>
  </svg>`;
}

// ---------- specimen vial ----------
const VIAL = {
  orange: (r) => `<circle cx="100" cy="128" r="30" fill="#E58C3E"/>${Array.from({ length: 40 }, () => `<circle cx="${f(78 + r() * 44)}" cy="${f(106 + r() * 44)}" r=".9" fill="#B5652A" opacity=".6"/>`).join("")}<ellipse cx="90" cy="116" rx="9" ry="5" fill="#FFFFFF" opacity=".25"/><path d="M100 98 q2 -6 6 -8" stroke="#6B7A4A" stroke-width="1.6" fill="none"/>`,
  peel: (r) => Array.from({ length: 6 }, (_, i) => `<path d="M${f(74 + r() * 30)},${f(150 - i * 9)} q${f(10 + r() * 14)},${f(-10 - r() * 10)} ${f(26 + r() * 10)},${f(-2 + r() * 4)}" stroke="#E08A3A" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M${f(74 + r() * 30)},${f(152 - i * 9)} q12,-8 26,0" stroke="#F6E2BE" stroke-width="2" fill="none" opacity=".8"/>`).join(""),
  pulp: (r) => `<path d="M72 160 V120 Q100 108 128 120 V160 Z" fill="#F0A24E" opacity=".85"/>${Array.from({ length: 30 }, () => `<ellipse cx="${f(76 + r() * 48)}" cy="${f(122 + r() * 36)}" rx="${f(2 + r() * 2.5)}" ry="${f(4 + r() * 3)}" fill="#F8C47E" opacity=".8" transform="rotate(${f(r() * 180)} ${f(76 + r() * 48)} ${f(122 + r() * 36)})"/>`).join("")}`,
  tomato: () => `<path d="M100 98 C130 98 134 120 132 132 C128 154 114 160 100 160 C86 160 72 154 68 132 C66 120 70 98 100 98 Z" fill="#C9483A"/><path d="M100 100 l-6 -8 l6 4 l6 -6 l-1 8 l9 -1 l-9 6 l6 5 l-10 -3 l-2 6 l-1 -7 l-9 1 l8 -5 Z" fill="#7C8C55"/><ellipse cx="85" cy="116" rx="7" ry="4" fill="#FFFFFF" opacity=".25"/>`,
  pear: () => `<path d="M100 96 C107 96 109 106 110 114 C113 126 128 132 128 146 C128 157 116 162 100 162 C84 162 72 157 72 146 C72 132 87 126 90 114 C91 106 93 96 100 96 Z" fill="#C7C77C"/><path d="M100 96 q1 -6 5 -9" stroke="#6E5A3C" stroke-width="1.6" fill="none"/><ellipse cx="114" cy="148" rx="6" ry="5" fill="#9C8A52" opacity=".7"/><path d="M82 140 q2 -8 7 -12" stroke="#FFFFFF" stroke-width="2.5" fill="none" opacity=".4"/>`,
  foam: (r) => [[84, 146, 15], [104, 140, 19], [122, 148, 13], [92, 124, 13], [112, 122, 12], [102, 106, 10], [76, 156, 8], [128, 158, 7]].map(([x, y, s]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#FFFFFF" stroke="#DCD8CC" stroke-width=".8"/>`).join("") + Array.from({ length: 10 }, () => `<circle cx="${f(80 + r() * 40)}" cy="${f(110 + r() * 45)}" r="${f(.8 + r() * 2)}" fill="none" stroke="#C9C4B5" stroke-width=".6"/>`).join(""),
  cream: () => `<path d="M72 162 q-4 -16 12 -18 q-6 -16 12 -18 q-2 -14 8 -20 q5 -6 1 -12 q14 6 12 20 q16 2 12 18 q16 4 10 18 q2 6 -2 12 Z" fill="#FBF6E9" stroke="#E1D6BF" stroke-width=".8"/><path d="M84 144 q16 6 34 0 M92 126 q10 4 20 0" fill="none" stroke="#E1D6BF" stroke-width="1"/>`,
  water: () => `<path d="M68 122 Q100 128 132 122 V160 Q100 166 68 160 Z" fill="#B8C5C0" opacity=".7"/><path d="M68 122 Q100 128 132 122" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".9"/>`,
  cotton: (r) => Array.from({ length: 40 }, () => { const x = 74 + r() * 52, y = 112 + r() * 46; return `<path d="M${f(x)},${f(y)} q${f((r() - .5) * 20)},${f((r() - .5) * 14)} ${f((r() - .5) * 26)},${f((r() - .5) * 10)}" stroke="#FFFFFF" stroke-width="${f(1 + r() * 2)}" fill="none" opacity=".9"/>`; }).join("") + `<ellipse cx="100" cy="138" rx="26" ry="20" fill="#FFFFFF" opacity=".55"/>`,
  sand: (r) => `<path d="M68 134 Q100 128 132 134 V160 Q100 166 68 160 Z" fill="#D8C49B"/>` + Array.from({ length: 160 }, () => `<circle cx="${f(70 + r() * 60)}" cy="${f(134 + r() * 26)}" r=".7" fill="${r() > .5 ? "#A98F60" : "#F1E3C2"}"/>`).join("")
};

function vial(sp, uid) {
  const r = rng(sp.id);
  const draw = VIAL[sp.tex] || VIAL.water;
  return `<svg class="specimen vial" viewBox="30 44 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sp.name}, specimen jar">
    <defs><clipPath id="vc-${uid}"><path d="M70 84 Q66 86 66 94 V158 Q66 168 78 168 H122 Q134 168 134 158 V94 Q134 86 130 84 Z"/></clipPath>
      <radialGradient id="vs-${uid}"><stop offset="0" stop-color="${INK}" stop-opacity=".3"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
      <linearGradient id="vg-${uid}" x1="0" x2="1"><stop offset="0" stop-color="#B8C5C0" stop-opacity=".45"/><stop offset=".5" stop-color="#E6EEEA" stop-opacity=".12"/><stop offset="1" stop-color="#8FA39C" stop-opacity=".45"/></linearGradient></defs>
    <ellipse cx="102" cy="172" rx="48" ry="9" fill="url(#vs-${uid})"/>
    <g clip-path="url(#vc-${uid})">${draw(r)}</g>
    <path d="M70 84 Q66 86 66 94 V158 Q66 168 78 168 H122 Q134 168 134 158 V94 Q134 86 130 84 Z" fill="url(#vg-${uid})" stroke="${INK}" stroke-width=".9" stroke-opacity=".6"/>
    <rect x="72" y="70" width="56" height="16" rx="3" fill="#A17C58" stroke="${INK}" stroke-width=".8" stroke-opacity=".6"/>
    <path d="M74 74 H126 M74 78 H126 M74 82 H126" stroke="#7E5D3E" stroke-width=".5"/>
    <rect x="76" y="66" width="48" height="6" rx="2" fill="#B9946D" stroke="${INK}" stroke-width=".6" stroke-opacity=".5"/>
    <path d="M74 96 V156" stroke="#FFFFFF" stroke-width="4" opacity=".45" stroke-linecap="round"/><path d="M82 96 V120" stroke="#FFFFFF" stroke-width="1.5" opacity=".4" stroke-linecap="round"/>
    <g transform="rotate(-2 104 150)"><rect x="84" y="140" width="40" height="18" rx="1.5" fill="#F1E8D7" stroke="${INK}" stroke-width=".6" stroke-opacity=".7"/>
    <text x="104" y="152.5" text-anchor="middle" font-family="Courier Prime, monospace" font-size="8" fill="${INK}">${sp.id}</text></g>
  </svg>`;
}

let uidN = 0;
export function specimenArt(sp) {
  if (!sp) return "";
  const uid = sp.id.replace(".", "") + "-" + (uidN++);
  return sp.display === "vial" ? vial(sp, uid) : cube(sp, uid);
}

// ---------- response diagram (schematic, not measured) ----------
export function responseDiagram(rec) {
  if (!rec) return "";
  const W = 420, H = 190, x0 = 46, x1 = 404, yTop = 34, yBot = 150;
  const fast = rec.speed === "instant", back = rec.reversibility === "reversible";
  const melt = /melt|deflate|collapse/i.test(rec.mode);
  const X = t => x0 + (x1 - x0) * t, Y = h => yBot - (yBot - yTop) * h;
  const tPress = .16, tRelease = .56;
  const low = fast ? .38 : .5;
  let d = `M${X(0)},${Y(1)} L${X(tPress)},${Y(1)} `;
  d += fast ? `C${X(tPress + .02)},${Y(1)} ${X(tPress + .02)},${Y(low)} ${X(tPress + .05)},${Y(low)} L${X(tRelease)},${Y(low)} `
    : `C${X(tPress + .12)},${Y(1)} ${X(tPress + .2)},${Y(low)} ${X(tRelease)},${Y(low)} `;
  if (back) d += fast ? `C${X(tRelease + .02)},${Y(low)} ${X(tRelease + .03)},${Y(.97)} ${X(tRelease + .07)},${Y(.97)} L${X(1)},${Y(.97)}`
    : `C${X(tRelease + .15)},${Y(low)} ${X(tRelease + .25)},${Y(.9)} ${X(1)},${Y(.92)}`;
  else if (melt) d += `C${X(tRelease + .12)},${Y(low)} ${X(.85)},${Y(low - .12)} ${X(1)},${Y(low - .28)}`;
  else d += `C${X(tRelease + .03)},${Y(low)} ${X(tRelease + .05)},${Y(low + .08)} ${X(tRelease + .1)},${Y(low + .08)} L${X(1)},${Y(low + .08)}`;
  return `<svg class="diagram" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematic response curve: ${rec.mode}">
    <g font-family="Courier Prime, monospace" font-size="9" fill="#5A503D" letter-spacing=".6">
      <line x1="${x0}" y1="${yTop - 10}" x2="${x0}" y2="${yBot}" stroke="#5A503D" stroke-width=".8"/>
      <line x1="${x0}" y1="${yBot}" x2="${x1}" y2="${yBot}" stroke="#5A503D" stroke-width=".8"/>
      ${[0, .25, .5, .75, 1].map(h => `<line x1="${x0 - 4}" y1="${Y(h)}" x2="${x0}" y2="${Y(h)}" stroke="#5A503D" stroke-width=".8"/><line x1="${x0}" y1="${Y(h)}" x2="${x1}" y2="${Y(h)}" stroke="#5A503D" stroke-width=".3" stroke-dasharray="2 4"/>`).join("")}
      <text x="${x0 - 8}" y="${Y(1) + 3}" text-anchor="end">100%</text><text x="${x0 - 8}" y="${Y(.5) + 3}" text-anchor="end">50%</text>
      <text x="${x0}" y="${yTop - 16}">SHAPE (HEIGHT)</text>
      <line x1="${X(tPress)}" y1="${yTop - 6}" x2="${X(tPress)}" y2="${yBot}" stroke="#6E302F" stroke-width=".7" stroke-dasharray="3 3"/>
      <line x1="${X(tRelease)}" y1="${yTop - 6}" x2="${X(tRelease)}" y2="${yBot}" stroke="#6E302F" stroke-width=".7" stroke-dasharray="3 3"/>
      <text x="${X(tPress) + 4}" y="${yTop - 2}" fill="#6E302F">PRESS ↓</text><text x="${X(tRelease) + 4}" y="${yTop - 2}" fill="#6E302F">RELEASE ↑</text>
      <text x="${x1}" y="${yBot + 16}" text-anchor="end">TIME →</text>
      <text x="${x0}" y="${yBot + 30}" fill="#A17C58">SCHEMATIC AFTER OBSERVATION · NOT MEASURED</text>
    </g>
    <path d="${d}" fill="none" stroke="#4A3027" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export const favicon = seal({ text: false, id: "fav" });
