// Drawn assets: the I.A.M. rosette seal and specimen illustrations.

const INK = "#453D37";

// ---------- guilloché rosette ----------
function trochoid(R, r, d, steps, cx, cy, scale, phase = 0) {
  // hypotrochoid: closed when (R/r) is rational; we loop enough turns to close
  let pts = [];
  const turns = r / gcd(R, r);
  const N = steps * turns;
  for (let i = 0; i <= N; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = (R - r) * Math.cos(t + phase) + d * Math.cos(((R - r) / r) * t + phase);
    const y = (R - r) * Math.sin(t + phase) - d * Math.sin(((R - r) / r) * t + phase);
    pts.push(`${(cx + x * scale).toFixed(2)},${(cy + y * scale).toFixed(2)}`);
  }
  return "M" + pts.join("L") + "Z";
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

const sealCache = {};
export function seal({ color = "#963D4D", text = true, id = "s", hollow = false } = {}) {
  const key = color + text + id + hollow;
  if (sealCache[key]) return sealCache[key];
  const c = 100;
  const layers = [
    trochoid(60, 13, 30, 120, c, c, 0.95),
    trochoid(60, 13, 22, 120, c, c, 0.95, Math.PI / 13),
    trochoid(48, 11, 18, 110, c, c, 0.92),
    trochoid(35, 8, 14, 90, c, c, 0.9, 0.2)
  ];
  const ring = `<circle cx="100" cy="100" r="96" fill="none" stroke="${color}" stroke-width="1.6"/>
    <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width=".6"/>
    <circle cx="100" cy="100" r="${text ? 74 : 86}" fill="none" stroke="${color}" stroke-width=".8"/>`;
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2, r1 = 92, r2 = i % 6 === 0 ? 87 : 89.5;
    return `M${(c + r1 * Math.cos(a)).toFixed(2)},${(c + r1 * Math.sin(a)).toFixed(2)}L${(c + r2 * Math.cos(a)).toFixed(2)},${(c + r2 * Math.sin(a)).toFixed(2)}`;
  }).join("");
  const inner = text ? `<g transform="translate(100 100) scale(.66) translate(-100 -100)">` : `<g>`;
  const label = text ? `
    <defs><path id="sealpath-${id}" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0"/></defs>
    <text font-family="IBM Plex Mono, monospace" font-size="10.4" letter-spacing="2.2" fill="${color}">
      <textPath href="#sealpath-${id}" startOffset="0">INSTITUTE OF ANIMATE MATTER · DEPT. OF MATERIAL RESPONSES ·</textPath>
    </text>` : "";
  const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="I.A.M. seal">
    ${ring}<path d="${ticks}" stroke="${color}" stroke-width=".8"/>${label}
    ${inner}${layers.map((d, i) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${i === 0 ? .55 : .45}" opacity="${1 - i * .12}"/>`).join("")}</g>
    <circle cx="100" cy="100" r="${text ? 17 : 20}" fill="${text && !hollow ? "#FFFDF6" : "none"}" stroke="${color}" stroke-width=".8"/>
    <text x="100" y="${text ? 104 : 105}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="${text ? 11 : 13}" font-weight="600" fill="${color}">I.A.M.</text>
  </svg>`;
  sealCache[key] = svg;
  return svg;
}

// ---------- specimen illustrations ----------
const s = (body, label) => `<svg class="specimen" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><g stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</g><ellipse cx="100" cy="158" rx="62" ry="5" fill="${INK}" opacity=".08"/></svg>`;

const ART = {
  "001": s(`<rect x="38" y="52" width="124" height="88" rx="16" fill="#F4EBAE"/>
    <path d="M38 68 q62 -22 124 0" fill="none" opacity=".35"/>
    ${[[60, 82, 6, 4], [86, 74, 4, 3], [112, 86, 7, 5], [140, 76, 4, 3], [70, 110, 5, 4], [100, 112, 4, 3], [128, 116, 6, 4], [52, 128, 3, 2], [146, 104, 4, 3], [90, 96, 3, 2], [116, 102, 3, 2]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="#E7D98A" stroke-width="1.1"/>`).join("")}`, "Sponge"),
  "002": s(`<path d="M100 34 L156 60 L100 86 L44 60 Z" fill="#EEF3FB"/>
    <path d="M44 60 L100 86 L100 146 L44 120 Z" fill="#DCE6F7"/>
    <path d="M156 60 L100 86 L100 146 L156 120 Z" fill="#C6D5EE"/>
    <path d="M62 66 l22 10 M60 78 v22" stroke="#FFFDF6" stroke-width="3" opacity=".9"/>
    <path d="M150 132 q8 10 0 14 q-8 -4 0 -14 Z" fill="#DCE6F7"/>`, "Ice"),
  "003": s(`<path d="M40 72 L70 50 L98 64 L128 44 L162 70 L152 104 L164 130 L126 144 L98 132 L66 146 L36 122 L48 98 Z" fill="#E4E4DE"/>
    <path d="M70 50 L80 96 L48 98 M98 64 L80 96 L98 132 M128 44 L120 92 L98 64 M162 70 L120 92 L152 104 M120 92 L126 144 M80 96 L66 146 M120 92 L98 132" fill="none" stroke-width="1" opacity=".7"/>
    <path d="M76 60 l10 4 M134 56 l8 6" stroke="#FFFDF6" stroke-width="3"/>`, "Aluminium foil"),
  "004": s(`<circle cx="100" cy="96" r="54" fill="#F2A15A"/>
    ${Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, r = 10 + (i * 37 % 40); return `<circle cx="${(100 + r * Math.cos(a)).toFixed(1)}" cy="${(96 + r * Math.sin(a)).toFixed(1)}" r="1.1" fill="${INK}" stroke="none" opacity=".35"/>`; }).join("")}
    <path d="M100 42 q4 -10 2 -16" fill="none"/><path d="M103 34 q18 -14 34 -4 q-16 14 -34 4 Z" fill="#C5CCBB"/>
    <path d="M70 76 q8 -12 22 -16" stroke="#FFFDF6" stroke-width="3" fill="none" opacity=".8"/>`, "Orange"),
  "005": s(`<path d="M42 140 V86 q0 -44 58 -44 q58 0 58 44 V140 Z" fill="#D9A25F"/>
    <path d="M52 136 V90 q0 -36 48 -36 q48 0 48 36 V136 Z" fill="#F6E3B8" stroke-width="1.2"/>
    ${[[78, 84, 4], [104, 74, 3], [122, 96, 5], [90, 110, 3], [70, 118, 2.5], [118, 122, 3], [100, 94, 2]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .7}" fill="#E8CC92" stroke-width="1"/>`).join("")}`, "Bread"),
  "006": s(`<path d="M100 48 C150 48 160 84 156 104 C150 138 124 148 100 148 C76 148 50 138 44 104 C40 84 50 48 100 48 Z" fill="#E96850"/>
    <path d="M100 52 l-8 -12 l8 6 l8 -8 l-2 12 l14 -2 l-14 8 l10 8 l-16 -4 l-6 10 l-2 -12 l-14 2 l12 -8 Z" fill="#9FB38A"/>
    <path d="M66 78 q10 -12 24 -14" stroke="#FFFDF6" stroke-width="3" fill="none" opacity=".75"/>`, "Tomato"),
  "007": s(`<path d="M100 40 C112 40 116 58 118 72 C122 92 150 100 150 124 C150 144 128 152 100 152 C72 152 50 144 50 124 C50 100 78 92 82 72 C84 58 88 40 100 40 Z" fill="#D8DB8E"/>
    <path d="M100 40 q2 -10 8 -16" fill="none"/><path d="M106 30 q16 -8 26 2 q-14 8 -26 -2Z" fill="#C5CCBB"/>
    <ellipse cx="124" cy="128" rx="9" ry="7" fill="#B9A06A" stroke-width="1" opacity=".8"/>
    <path d="M70 116 q4 -14 14 -20" stroke="#FFFDF6" stroke-width="3" fill="none" opacity=".8"/>`, "Pear"),
  "008": s(`<ellipse cx="100" cy="140" rx="64" ry="10" fill="#DCE6F7"/>
    ${[[72, 118, 22], [100, 108, 28], [130, 120, 20], [86, 86, 20], [116, 84, 18], [100, 64, 16], [60, 132, 12], [144, 134, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFDF6"/>`).join("")}
    <circle cx="94" cy="60" r="3" fill="none" stroke-width="1"/><circle cx="134" cy="78" r="2" fill="none" stroke-width="1"/>`, "Shaving foam"),
  "009": s(`<ellipse cx="100" cy="142" rx="66" ry="12" fill="#F0D6D9"/>
    <path d="M52 136 q-6 -22 18 -26 q-8 -22 18 -26 q-4 -22 14 -28 q6 -10 0 -18 q22 8 18 30 q24 4 18 26 q26 4 18 26 q4 10 -2 16 Z" fill="#FFFDF6"/>
    <path d="M70 110 q30 8 60 0 M84 84 q18 6 34 0" fill="none" stroke-width="1.2" opacity=".6"/>`, "Cream foam"),
  "010": s(`<path d="M48 132 C36 112 50 78 76 70 C100 62 112 52 134 62 C160 74 166 108 152 130 C140 148 66 152 48 132 Z" fill="#D49A7A"/>
    <ellipse cx="104" cy="104" rx="22" ry="16" fill="#C2856A" stroke-width="1.1"/>
    <path d="M90 100 q14 -8 28 0 M88 106 q16 -8 32 0 M92 112 q12 -6 24 0" fill="none" stroke-width=".9" opacity=".7"/>
    <ellipse cx="72" cy="96" rx="7" ry="10" fill="#C2856A" stroke-width="1" transform="rotate(-20 72 96)"/>`, "Clay")
};

export const specimenArt = id => ART[id] || ART["001"];

// small looping sponge squeeze for the hero when no video is present
export const heroStill = `<svg viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <style>
    .sq{transform-origin:300px 430px;animation:squeeze 4.8s cubic-bezier(.5,0,.2,1) infinite}
    .palm{animation:press 4.8s cubic-bezier(.5,0,.2,1) infinite}
    @keyframes squeeze{0%,18%{transform:scale(1,1)}38%,52%{transform:scale(1.16,.55)}62%{transform:scale(.97,1.06)}72%,100%{transform:scale(1,1)}}
    @keyframes press{0%,18%{transform:translateY(0)}38%,52%{transform:translateY(118px)}62%,100%{transform:translateY(0)}}
    @media (prefers-reduced-motion:reduce){.sq,.palm{animation:none}}
  </style>
  <g class="sq" stroke="#FFFDF6" stroke-width="2.4" fill="none">
    <rect x="160" y="230" width="280" height="200" rx="34" fill="#F4EBAE" fill-opacity=".14"/>
    ${[[210, 290, 14, 9], [270, 272, 9, 6], [330, 300, 16, 11], [392, 280, 9, 6], [230, 360, 11, 8], [300, 366, 9, 6], [366, 376, 13, 9], [196, 400, 6, 4], [410, 340, 9, 6]].map(([x, y, a, b]) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}"/>`).join("")}
  </g>
  <g class="palm" fill="none" stroke="#FFFDF6" stroke-width="2.4" stroke-linecap="round" opacity=".9">
    <path d="M170 196 C190 150 230 130 300 128 C370 130 410 150 430 196"/>
    <path d="M214 140 L196 40 M262 128 L254 18 M314 128 L320 14 M362 140 L382 34"/>
    <path d="M430 196 L500 150"/>
  </g>
  <path d="M120 446 H480" stroke="#FFFDF6" stroke-width="1.2" stroke-dasharray="3 7" opacity=".7"/>
</svg>`;

export const favicon = seal({ text: false, id: "fav" });
