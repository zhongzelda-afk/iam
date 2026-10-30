// Live 3D heads drawn over the camera. Each slot holds one head that follows a face.
// Pressing deforms the surface where the hand is; materials that "keep" hold part of every press,
// so each visitor's head slowly becomes their own.
import * as THREE from "./lib/three.module.min.js";
import { buildHead } from "./heads3d.js?v=3";

const SEGS = 170;

export class LiveHeads {
  constructor(canvas, slots) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene();
    this.hemi = new THREE.HemisphereLight("#fff6ea", "#2a2622", 0.9);
    this.scene.add(this.hemi);
    this.depth = 0.5; this.bulge = 0.14;
    const key = new THREE.DirectionalLight("#fff3e2", 2.4); key.position.set(-3, 4, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight("#cfe6ff", 1.6); rim.position.set(4, 2.5, -3); this.scene.add(rim);
    const fill = new THREE.DirectionalLight("#ffffff", 0.35); fill.position.set(3, -1, 4); this.scene.add(fill);
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -5000, 5000);
    this.cache = {};
    this.slots = Array.from({ length: slots }, () => null);
  }

  // tint the ambient light toward the room's average colour (r, g, b 0..1), by amount 0..1
  setRoom(r, g, b, amount) {
    const room = new THREE.Color(r, g, b), lum = 0.3 * r + 0.59 * g + 0.11 * b || 1e-3;
    room.multiplyScalar(0.75 / lum); // keep the colour, not the darkness
    this.hemi.color.set("#fff6ea").lerp(room, amount * 0.6);
    this.hemi.groundColor.set("#2a2622").lerp(room.clone().multiplyScalar(0.3), amount * 0.6);
    this.renderer.toneMappingExposure = 1.05 * (1 - amount * 0.35 + amount * 0.35 * Math.min(1.4, Math.max(0.6, lum * 2.2)));
  }

  resize(W, H, dpr) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(W, H, false);
    Object.assign(this.camera, { left: 0, right: W, top: 0, bottom: -H });
    this.camera.updateProjectionMatrix();
  }

  template(id) {
    if (!this.cache[id]) this.cache[id] = buildHead(id, SEGS);
    return this.cache[id];
  }

  // give slot i a fresh head of material id (a new visitor starts with an untouched head)
  setHead(i, id) {
    if (this.slots[i]) this.scene.remove(this.slots[i].group);
    const t = this.template(id), group = t.clone(true);
    const mesh = group.children[0];
    mesh.geometry = t.children[0].geometry.clone();
    const pos = mesh.geometry.attributes.position, nrm = mesh.geometry.attributes.normal, count = pos.count;
    const base = Float32Array.from(pos.array), baseN = Float32Array.from(nrm.array), dir = new Float32Array(count * 3);
    for (let v = 0; v < count; v++) {
      const x = base[v * 3], y = base[v * 3 + 1], z = base[v * 3 + 2], l = Math.hypot(x, y, z) || 1;
      dir[v * 3] = x / l; dir[v * 3 + 1] = y / l; dir[v * 3 + 2] = z / l;
    }
    group.userData.baseRotZ = group.rotation.z;
    group.userData.baseRotY = 0.05; // nearly face on; the design sheet used a three quarter turn
    this.scene.add(group);
    this.slots[i] = { id, group, mesh, base, baseN, dir, live: new Float32Array(count), perm: new Float32Array(count), dirty: false };
  }

  clear(i) {
    if (this.slots[i]) { this.scene.remove(this.slots[i].group); this.slots[i] = null; }
  }

  // contact: unit vector in the head's own space pointing at the pressing hand; pressure 0..1
  press(i, contact, pressure, dt, dyn) {
    const s = this.slots[i];
    if (!s) return;
    const n = s.live.length, depth = this.depth, reach = 0.5; // reach is the cosine-space width of the press
    let changed = false;
    for (let v = 0; v < n; v++) {
      let target = 0;
      if (pressure > 0.02) {
        const c = s.dir[v * 3] * contact.x + s.dir[v * 3 + 1] * contact.y + s.dir[v * 3 + 2] * contact.z;
        const w = Math.max(0, (c - (1 - reach)) / reach);
        const ring = Math.exp(-Math.pow((c - (1 - reach * 1.35)) / 0.22, 2)); // material pushed aside swells around the dent
        target = pressure * (depth * w * w * (3 - 2 * w) - this.bulge * ring);
      }
      const rate = target > s.live[v] ? dyn.press : dyn.release;
      const next = s.live[v] + (target - s.live[v]) * Math.min(1, dt * rate);
      if (Math.abs(next - s.live[v]) > 1e-4) { s.live[v] = next; changed = true; }
    }
    if (changed) s.dirty = true;
  }

  // the press ends: keep part of it as a trace
  release(i, keep) {
    const s = this.slots[i];
    if (!s || keep <= 0) return;
    for (let v = 0; v < s.live.length; v++) s.perm[v] = Math.max(-0.08, Math.min(0.32, s.perm[v] + s.live[v] * keep * 0.6)); // presses add up
    s.dirty = true;
  }

  place(i, x, y, size, roll, squash, appear, now) {
    const s = this.slots[i];
    if (!s) return;
    const g = s.group, pop = appear < 1 ? 1 - Math.pow(1 - appear, 3) * Math.cos(appear * 4) : 1;
    g.position.set(x, -y, 0);
    const k = (size / 2) * Math.max(0.001, pop) * (1 + 0.012 * Math.sin(now / 900 + i * 2)); // slow breathing
    g.scale.set(k * (1 + 0.28 * squash), k * (1 - 0.36 * squash), k * (1 + 0.1 * squash));
    g.rotation.x = 0.28; // lean forward a little so the top of each head (stem, crown, calyx) shows
    g.rotation.z = g.userData.baseRotZ - roll;
    g.rotation.y = g.userData.baseRotY + Math.sin(now / 1700 + i) * 0.12; // a slow idle turn, so it reads as a solid
    g.visible = appear > 0.01;
  }

  // contact direction in the head's space from a screen-space offset (dx right, dy down)
  contactDir(i, dx, dy) {
    const s = this.slots[i];
    const v = new THREE.Vector3(dx, -dy, 0.55).normalize();
    if (s) v.applyQuaternion(s.group.quaternion.clone().invert());
    return v;
  }

  render() {
    for (const s of this.slots) {
      if (!s || !s.dirty) continue;
      const pos = s.mesh.geometry.attributes.position.array, n = s.live.length;
      for (let v = 0; v < n; v++) {
        const l = s.live[v], p = s.perm[v], d = l + p - 0.5 * Math.min(Math.max(l, 0), p);
        pos[v * 3] = s.base[v * 3] - s.baseN[v * 3] * d;
        pos[v * 3 + 1] = s.base[v * 3 + 1] - s.baseN[v * 3 + 1] * d;
        pos[v * 3 + 2] = s.base[v * 3 + 2] - s.baseN[v * 3 + 2] * d;
      }
      s.mesh.geometry.attributes.position.needsUpdate = true;
      s.mesh.geometry.computeVertexNormals();
      s.dirty = false;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
