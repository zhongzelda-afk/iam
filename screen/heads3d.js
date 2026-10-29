// I.A.M. material heads, direction C "soft relief": puffed, exaggerated proportions, small raised
// relief features, frosted soft-touch surface. Every head is built from one sphere, so all share
// proportion, light response and detail density; each keeps only one or two traits of its material.
import * as THREE from "./lib/three.module.min.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const col = (h) => new THREE.Color(h);
const mix = (a, b, t) => a.clone().lerp(b, clamp(t, 0, 1));
const theta = (n) => Math.atan2(n.x, n.z); // 0 faces the viewer

function mark(n, c, uDir, len, wid, depth, curve = 0) { // raised (depth > 0) or carved mark around direction c
  if (n.dot(c) < 0.6) return 0;
  const vDir = new THREE.Vector3().crossVectors(c, uDir).normalize();
  const d = n.clone().sub(c), u = d.dot(uDir), v = d.dot(vDir) - curve * u * u;
  return depth * (1 - smooth(len * 0.7, len, Math.abs(u))) * Math.exp(-(v * v) / (wid * wid));
}
const dent = (n, c, r, depth) => { const a = n.angleTo(c); return -depth * Math.exp(-(a * a) / (r * r)); };
function superShape(n, e, sx, sy, sz) {
  const s = Math.pow(Math.pow(Math.abs(n.x), e) + Math.pow(Math.abs(n.y), e) + Math.pow(Math.abs(n.z), e), 1 / e);
  return V(n.x / s * sx, n.y / s * sy, n.z / s * sz);
}
function noise3(x, y, z) { // smooth value noise, used only for the foil's large facets
  const h = (i, j, k) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
    l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
}

// a thin curved sheet (petal or leaf) wrapped around the head; u runs across, v from the base up
function sheet(mat, o) {
  const g = new THREE.PlaneGeometry(1, 1, 56, 44), pos = g.attributes.position, uv = g.attributes.uv, colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i), v = uv.getY(i), cu = 2 * u - 1;
    const width = 0.3 + 0.7 * smooth(0, 0.55, v);
    const a = o.az + cu * 0.5 * o.span * width;
    const e = o.e0 + v * (o.e1 - o.e0) * (1 - 0.28 * cu * cu);
    let vein = 0;
    if (o.vein) {
      const side = (v - Math.abs(cu) * 0.5) * 6;
      vein = Math.exp(-(cu * cu) / 0.004) * (1 - v * 0.6) + 0.6 * Math.exp(-Math.pow(side - Math.round(side), 2) / 0.006) * smooth(0.95, 0.4, Math.abs(cu)) * smooth(0.05, 0.2, v);
    }
    const r = o.r + o.curl * Math.pow(v, 2.6) + o.ruffle * Math.sin(cu * o.freq * Math.PI) * Math.pow(v, 3) + 0.018 * vein;
    pos.setXYZ(i, r * Math.cos(e) * Math.sin(a) * o.sx, r * Math.sin(e) * o.sy, r * Math.cos(e) * Math.cos(a) * o.sz);
    const c = mix(o.color(u, v), col("#eef6d2"), vein * 0.85);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat("#ffffff", { vc: true, side: THREE.DoubleSide }));
}

let ENV = null;
function studioEnv() { // a soft studio drawn on a canvas, only for reflective heads
  if (ENV || typeof document === "undefined") return ENV;
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#b8b4ae"); g.addColorStop(0.5, "#6a6762"); g.addColorStop(1, "#262422");
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.fillStyle = "#fffaf0"; x.fillRect(150, 40, 90, 60); x.fillStyle = "#dfefff"; x.fillRect(380, 70, 50, 90); x.fillStyle = "#cfc8bd"; x.fillRect(20, 110, 40, 50);
  ENV = new THREE.CanvasTexture(c); ENV.mapping = THREE.EquirectangularReflectionMapping; ENV.colorSpace = THREE.SRGBColorSpace;
  return ENV;
}

// the face of the series: two small raised eyes and a soft smile
export function face(n, mood = 0) {
  return mark(n, V(-0.27, 0.1, 0.96).normalize(), V(1, 0, -0.28).normalize(), 0.06, 0.04, 0.045)
    + mark(n, V(0.27, 0.1, 0.96).normalize(), V(1, 0, 0.28).normalize(), 0.06, 0.04, 0.045)
    + mark(n, V(0.0, -0.22, 0.97).normalize(), V(1, 0, 0), 0.13, 0.03, 0.03, 2.6 * (1 - mood));
}

export const MATS = {
  "001": { name: "Sponge", trait: "soft block, scrub top, a few pores", pal: ["#f2d25c", "#e1b93f", "#4f8a55"],
    shape: (n) => superShape(n, 3.3, 1.12, 0.86, 0.82),
    feature(n) {
      let d = 0;
      for (const [x, y, z, r] of [[0.5, 0.05, 0.86, 0.09], [-0.42, -0.3, 0.86, 0.07], [0.05, -0.45, 0.89, 0.06], [-0.75, 0.15, 0.64, 0.08], [0.85, -0.3, 0.42, 0.07], [0.25, -0.15, 0.95, 0.05]])
        d += dent(n, V(x, y, z).normalize(), r, 0.07);
      return d + (n.y > 0.5 ? 0.02 : 0);
    },
    paint: (n, p) => mix(mix(p[0], p[1], 0.5 - n.y * 0.6), p[2], smooth(0.42, 0.52, n.y)), tilt: -0.07 },

  "002": { name: "Ice", trait: "rounded block, one chamfer, a drip", pal: ["#d3ecf6", "#94c6dc", "#5b98b4"], ice: true,
    shape(n) { const p = superShape(n, 4.2, 0.98, 0.98, 0.9), cut = V(0.55, 0.6, 0.58).normalize(), k = p.dot(cut) - 0.98; if (k > 0) p.sub(cut.multiplyScalar(k * 0.85)); return p; },
    feature: (n) => -0.02 * smooth(0.3, 1, Math.abs(n.y)),
    paint: (n, p) => mix(mix(p[0], p[1], 0.55 - n.y * 0.6), p[2], smooth(0.2, -1, n.y) * 0.6),
    extras(mat) { const g = new THREE.SphereGeometry(0.11, 24, 16); g.scale(1, 1.45, 1); const m = new THREE.Mesh(g, mat("#a9d0e2", { ice: true })); m.position.set(-0.52, -1.0, 0.45); return [m]; },
    tilt: 0.11 },

  "003": { name: "Aluminium Foil", trait: "crumpled ball, sharp creases, mirror facets", pal: ["#f1f3f6", "#c3c8cf", "#858c96"], metal: true,
    shape: (n) => V(n.x * 1.02, n.y * 0.95, n.z * 0.98),
    feature(n) { // ridged noise: sharp fold lines with flat facets between them
      const r1 = noise3(n.x * 2.2 + 3, n.y * 2.2 + 1, n.z * 2.2 + 7), r2 = noise3(n.x * 4.6 + 9, n.y * 4.6 + 4, n.z * 4.6 + 2), r3 = noise3(n.x * 9 + 1, n.y * 9 + 5, n.z * 9 + 3);
      const fold = (q) => 1 - Math.abs(2 * q - 1);
      return 0.11 * Math.pow(fold(r1), 1.6) + 0.05 * Math.pow(fold(r2), 2) + 0.012 * fold(r3) - 0.09;
    },
    paint: (n, p) => mix(mix(p[0], p[1], 0.45 - n.y * 0.6), p[2], smooth(0.1, -1, n.y) * 0.5), tilt: 0.05 },

  "004": { name: "Orange", trait: "squat, sunken top", pal: ["#f39a3e", "#e2762a", "#b9541f"],
    shape: (n) => V(n.x * 1.06, n.y * 0.9, n.z * 1.02),
    feature: (n) => dent(n, V(0.08, 1, 0).normalize(), 0.22, 0.16) + 0.012 * Math.sin(n.x * 9) * Math.sin(n.z * 9),
    paint(n, p) { const top = Math.exp(-Math.pow(n.angleTo(V(0.08, 1, 0).normalize()), 2) / 0.03); return mix(mix(p[0], p[1], 0.5 - n.y * 0.5), p[2], top * 0.9); },
    extras(mat) { const g = new THREE.SphereGeometry(0.16, 24, 16); g.scale(1.6, 0.35, 0.8); const m = new THREE.Mesh(g, mat("#5d7a3a")); m.position.set(0.18, 0.86, 0.02); m.rotation.set(0.2, 0.4, -0.35); return [m]; },
    tilt: -0.14 },

  "006": { name: "Tomato", trait: "squat lobes, star calyx", pal: ["#ef5a43", "#d63a2c", "#9e2420"],
    shape(n) { const lobe = 1 + 0.06 * Math.cos(5 * theta(n)) * (1 - Math.abs(n.y)); return V(n.x * 1.1 * lobe, n.y * 0.8, n.z * 1.06 * lobe); },
    feature: (n) => dent(n, V(0, 1, 0), 0.3, 0.1),
    paint: (n, p) => mix(mix(p[0], p[1], 0.45 - n.y * 0.6), p[2], smooth(0, -1, n.y) * 0.55),
    extras(mat) {
      const s = new THREE.Shape();
      for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.1 : 0.42; s[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
      const m = new THREE.Mesh(g, mat("#5f8a42")); m.rotation.set(-Math.PI / 2, 0, 0.3); m.position.set(0, 0.72, 0);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 12), mat("#557a3a")); st.position.set(0, 0.82, 0);
      return [m, st];
    },
    tilt: 0.09 },

  "007": { name: "Pear", trait: "off-centre bulb, leaning neck", pal: ["#d9cf5e", "#b9b54a", "#8c8f3a"],
    shape(n) { const y = n.y, prof = 0.62 + 0.42 * smooth(0.75, -0.35, y) - 0.08 * smooth(-0.2, -1, y), lean = 0.26 * Math.pow(Math.max(0, y + 0.1), 2); return V(n.x * prof + lean, y * 1.18 - 0.05, n.z * prof * 0.95); },
    feature: (n) => dent(n, V(0, -1, 0), 0.25, 0.05),
    paint(n, p) { const blush = Math.exp(-Math.pow(n.angleTo(V(-0.7, -0.1, 0.7).normalize()), 2) / 0.25); return mix(mix(p[0], p[1], 0.4 - n.y * 0.5), col("#c9864a"), blush * 0.35); },
    extras(mat) { const c = new THREE.CatmullRomCurve3([V(0.33, 1.02, 0), V(0.38, 1.22, 0), V(0.5, 1.34, 0.02)]); return [new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.035, 10), mat("#6b4a2f"))]; },
    tilt: 0.17, faceY: -0.12 },

  "008": { name: "Shaving Foam", trait: "merged puffs, a peak", pal: ["#fbfbf8", "#e8eef2", "#b8c8d4"],
    shape(n) {
      let r = 0.78;
      for (const [x, y, z, a, s] of [[0.45, -0.25, 0.3, 0.3, 0.55], [-0.5, -0.3, 0.25, 0.3, 0.5], [0.1, -0.3, -0.5, 0.3, 0.5], [0, 0.55, 0.1, 0.35, 0.35]])
        r += s * Math.exp(-Math.pow(n.angleTo(V(x, y, z).normalize()), 2) / a);
      r += 0.35 * Math.pow(smooth(0.7, 1, n.y), 2); // the peak
      return V(n.x * r, n.y * r * 0.85 - 0.08, n.z * r * 0.92);
    },
    feature: () => 0,
    paint: (n, p) => mix(mix(p[0], p[1], 0.3 - n.y * 0.6), p[2], smooth(0, -1, n.y) * 0.5), tilt: -0.12, scale: 0.86 },

  "009": { name: "Cream", trait: "swirled dollop, curled tip", pal: ["#fbf3e1", "#f0e0bd", "#d9bf8d"],
    shape(n) {
      const y = n.y, prof = 0.95 * smooth(1.05, -0.35, y) + 0.08, swirl = 1 + 0.07 * Math.sin(6 * theta(n) + 9 * y) * (1 - Math.abs(y));
      const tip = smooth(0.82, 1, y);
      return V(n.x * prof * swirl * 1.08 + 0.22 * tip, y * 1.18 - 0.08, n.z * prof * swirl);
    },
    feature: () => 0,
    paint: (n, p) => mix(mix(p[0], p[1], 0.35 - n.y * 0.6), p[2], smooth(-0.3, -1, n.y) * 0.6), tilt: 0.06 },

  "012": { name: "Rose", trait: "bud wrapped in petals, curled edges", pal: ["#ee8aa0", "#d0506f", "#8f2c4a"],
    shape(n) { const y = n.y, prof = 0.8 + 0.12 * smooth(0.9, -0.2, y) - 0.2 * smooth(-0.3, -1, y); return V(n.x * prof, y * 1.04, n.z * prof * 0.95); },
    feature(n) { // tight spiral of petal edges on the crown
      const a = theta(n), t = Math.acos(clamp(n.y, -1, 1));
      let d = 0;
      for (let i = 0; i < 3; i++) { const e = (((a + i * 2.1 - t * 3.2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); d += 0.07 * smooth(0.0, 0.05, e) * smooth(0.9, 0.2, e) * smooth(1.25, 0.2, t) - 0.03 * Math.exp(-(e * e) / 0.004) * smooth(1.25, 0.2, t); }
      return d + dent(n, V(0, 1, 0), 0.14, 0.08);
    },
    paint: (n, p) => mix(mix(p[0], p[1], 0.5 - n.y * 0.6), p[2], smooth(0.8, 1, n.y) * 0.7 + smooth(-0.2, -1, n.y) * 0.4),
    extras(mat) {
      const petal = (az, span, e1, r, curl, tone) => sheet(mat, { az, span, e0: -1.35, e1, r, curl, ruffle: 0.015, freq: 1.5, sx: 0.84, sy: 1.04, sz: 0.8,
        color: (u, v) => mix(mix(col("#7e2440"), col(tone), smooth(0, 0.45, v)), col("#f4a7b8"), smooth(0.75, 1, v) * 0.6) });
      const out = [
        petal(0, 2.2, -0.5, 1.04, 0.32, "#d4567a"),
        petal(1.35, 2.3, 0.62, 1.03, 0.4, "#d65a7b"), petal(-1.35, 2.3, 0.62, 1.03, 0.4, "#d65a7b"),
        petal(2.6, 2.4, 0.85, 1.06, 0.45, "#c84c6c"), petal(-2.6, 2.4, 0.85, 1.06, 0.45, "#c84c6c"),
      ];
      const g = new THREE.SphereGeometry(0.3, 24, 16); g.scale(1.3, 0.3, 0.7);
      const a = new THREE.Mesh(g, mat("#4f7a43")); a.position.set(-0.42, -0.98, 0.22); a.rotation.z = 0.55; const b = a.clone(); b.position.set(0.44, -1.0, 0.12); b.rotation.z = -0.55;
      return [...out, a, b];
    },
    tilt: -0.1 },

  "013": { name: "Cabbage Leaf", trait: "one cupped leaf, ruffled rim, white midrib and veins", pal: ["#c2df86", "#8fbf58", "#5d8f3a"],
    shape(n) { // a single thick leaf: broad top, narrower base, ruffled rim, edges bending back
      const phi = Math.atan2(n.y, n.x), rim = 1 - Math.abs(n.z);
      const w = (0.78 + 0.32 * smooth(-1, 0.2, n.y)) * (1 + 0.05 * Math.sin(11 * phi) * rim);
      const x = n.x * w * 1.08, y = n.y * 1.1 * (1 + 0.04 * Math.sin(11 * phi) * rim);
      const z = n.z * 0.42 - 0.32 * x * x + 0.2 * Math.sin(9 * phi + 0.6) * Math.pow(rim, 3);
      return V(x, y, z);
    },
    vein(n) { // midrib up the middle (thinning out under the face) and side veins rising from it
      const front = smooth(-0.2, 0.3, n.z), x = n.x, y = n.y;
      const faceZone = Math.exp(-(x * x) / 0.16 - Math.pow(y + 0.05, 2) / 0.14);
      const mid = Math.exp(-(x * x) / (0.0025 + 0.004 * smooth(0.6, -1, y))) * (1 - faceZone);
      const t = (y - Math.abs(x) * 0.9) * 2.6, side = Math.exp(-Math.pow(t - Math.round(t), 2) / 0.012) * smooth(0.04, 0.12, Math.abs(x)) * smooth(0.95, 0.6, Math.abs(x)) * (1 - faceZone);
      return Math.min(1, mid + 0.75 * side) * front;
    },
    feature(n) { return 0.035 * this.vein(n); },
    paint(n, p) {
      const rim = smooth(0.5, 0.1, Math.abs(n.z));
      return mix(mix(mix(p[0], p[1], 0.35 - n.y * 0.4), p[2], rim * 0.7 + smooth(-0.1, -1, n.z) * 0.4), col("#f1f8dc"), this.vein(n) * 0.9);
    },
    extras(mat) { const g = new THREE.CylinderGeometry(0.07, 0.12, 0.42, 16); const m = new THREE.Mesh(g, mat("#e4f0c4")); m.position.set(0, -1.18, 0.05); m.rotation.z = 0.08; return [m]; },
    tilt: 0.13 },

  "014": { name: "Madeleine", trait: "scallop shell body, fanned ridges, browned rim", pal: ["#f2c77c", "#dc9d4c", "#9a5a25"],
    shape(n) { // flattened shell: narrow rounded base, wide top
      const w = 0.6 + 0.36 * smooth(-1, 0.3, n.y);
      return V(n.x * w * 1.08, n.y * 1.04 + 0.03, n.z * (n.z > 0 ? 0.62 : 0.72));
    },
    ridge(n) { // ridges fanning out from the base over the front and the rim
      const a = Math.atan2(n.x, n.y + 1.1), front = smooth(-0.35, 0.15, n.z);
      const r = Math.pow(0.5 + 0.5 * Math.cos(a * 44), 1.2);
      const faceZone = Math.exp(-(n.x * n.x) / 0.16 - Math.pow(n.y + 0.06, 2) / 0.14) * smooth(0.5, 0.85, n.z);
      return r * front * (1 - 0.95 * faceZone) * smooth(-0.95, -0.7, n.y);
    },
    feature(n) { return 0.05 * this.ridge(n) - 0.015; },
    paint(n, p) {
      const rim = smooth(0.55, 0.15, Math.abs(n.z));
      return mix(mix(mix(p[0], p[1], 0.4 - n.y * 0.5), p[2], rim * 0.95 + smooth(0.2, -1, n.y) * 0.3), col("#fbe2ae"), this.ridge(n) * 0.45 * (1 - rim));
    },
    tilt: -0.08 },
};

export function material(c, o = {}) {
  return new THREE.MeshPhysicalMaterial({ color: c, vertexColors: !!o.vc, roughness: o.ice ? 0.4 : o.metal ? 0.26 : 0.7, metalness: o.metal ? 0.9 : 0,
    clearcoat: 0.35, clearcoatRoughness: 0.75, sheen: o.metal ? 0 : 0.3, sheenColor: col("#ffffff"), transmission: o.ice ? 0.1 : 0, thickness: 1,
    envMap: o.metal ? studioEnv() : null, envMapIntensity: 1.4, side: o.side || THREE.FrontSide });
}

const satColor = (c, s) => { const h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, clamp(h.s * s, 0, 1), h.l); };
const prop = (p) => V(p.x * 0.94, p.y * 1.1 + 0.04 * p.x * p.x, p.z);

// builds one head; segs controls mesh density (lower for live use)
export function buildHead(id, segs = 220) {
  const M = MATS[id], pal = M.pal.map((h) => satColor(col(h), 1.08));
  const geo = new THREE.SphereGeometry(1, segs, Math.round(segs * 0.72));
  const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), n = new THREE.Vector3();
  const fy = M.faceY || 0;
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const p = prop(M.shape(n));
    const fn = fy ? V(n.x, n.y - fy, n.z).normalize() : n;
    p.add(n.clone().multiplyScalar(M.feature(n) + face(fn)));
    pos.setXYZ(i, p.x, p.y, p.z);
    const c = M.paint(n, pal);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, material("#ffffff", { vc: true, ice: M.ice, metal: M.metal })));
  for (const e of (M.extras ? M.extras((c, o) => material(c, o)) : [])) g.add(e);
  g.rotation.z = M.tilt * 1.4;
  g.rotation.y = 0.18;
  if (M.scale) g.scale.setScalar(M.scale);
  return g;
}
