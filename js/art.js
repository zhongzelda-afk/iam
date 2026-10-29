// Specimen images: lit material cubes and glass jars, drawn with SVG lighting filters.
// They are art-directed archive representations. Real photos can replace them (photo: true in data.js).

let uidN = 0;
const f = n => n.toFixed(1);

// ---------- small logo mark ----------
export function mark(color = "#C77B85") {
  let d = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    d += `<ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(${f(a * 180 / Math.PI)} 12 12)" fill="none" stroke="${color}" stroke-width=".5"/>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${d}<circle cx="12" cy="12" r="2" fill="${color}"/></svg>`;
}

// ---------- surface recipes ----------
// each returns filter primitives that turn the face rect into a lit material surface
const SURF = {
  sponge: { color: "#E2C25A", f: `
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="2.2" lighting-color="#F2D978" result="lit"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
    <feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="2" seed="7" result="p"/>
    <feColorMatrix in="p" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 5.4" result="holes"/>
    <feFlood flood-color="#B08F33"/><feComposite in2="holes" operator="in" result="dark"/>
    <feMerge><feMergeNode in="lit"/><feMergeNode in="dark"/></feMerge>` },
  bread: { color: "#F1DEB2", f: `
    <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="5" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="1.4" lighting-color="#F5E4BC" result="lit"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
    <feTurbulence type="fractalNoise" baseFrequency=".07 .12" numOctaves="2" seed="11" result="p"/>
    <feColorMatrix in="p" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -8 4.9" result="holes"/>
    <feFlood flood-color="#C9A866"/><feComposite in2="holes" operator="in" result="dark"/>
    <feMerge><feMergeNode in="lit"/><feMergeNode in="dark"/></feMerge>` },
  clay: { color: "#B97A5E", f: `
    <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="2" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="3" lighting-color="#C4876A" result="lit"><feDistantLight azimuth="230" elevation="50"/></feDiffuseLighting>
    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="4" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 .3  0 0 0 0 .18  0 0 0 0 .12  0 0 0 .25 0" result="grain"/>
    <feMerge><feMergeNode in="lit"/><feMergeNode in="grain"/></feMerge>` },
  foil: { color: "#C7C8C4", f: `
    <feTurbulence type="turbulence" baseFrequency=".045" numOctaves="4" seed="9" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="4" lighting-color="#B9BAB6" result="d"><feDistantLight azimuth="225" elevation="40"/></feDiffuseLighting>
    <feSpecularLighting in="n" surfaceScale="5" specularConstant="1.1" specularExponent="22" lighting-color="#FFFFFF" result="s"><feDistantLight azimuth="225" elevation="35"/></feSpecularLighting>
    <feComposite in="s" in2="d" operator="arithmetic" k1="0" k2="1" k3=".75" k4="0"/>` },
  ice: { color: "#DCE8EA", alpha: .78, f: `
    <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="6" result="n"/>
    <feSpecularLighting in="n" surfaceScale="6" specularConstant=".9" specularExponent="30" lighting-color="#FFFFFF" result="s"><feDistantLight azimuth="235" elevation="50"/></feSpecularLighting>
    <feFlood flood-color="#CFE0E3" flood-opacity=".75" result="b"/>
    <feTurbulence type="turbulence" baseFrequency=".06" numOctaves="1" seed="12" result="c"/>
    <feColorMatrix in="c" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -14 2.2" result="cracks"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="cracks"/><feMergeNode in="s"/></feMerge>` },
  gel: { color: "#D8B7B8", alpha: .8, f: `
    <feTurbulence type="fractalNoise" baseFrequency=".015" numOctaves="2" seed="8" result="n"/>
    <feSpecularLighting in="n" surfaceScale="5" specularConstant="1" specularExponent="35" lighting-color="#FFFFFF" result="s"><feDistantLight azimuth="235" elevation="55"/></feSpecularLighting>
    <feFlood flood-color="#D9A9AE" flood-opacity=".72" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="s"/></feMerge>` },
  community: { color: "#E4E0D8", f: `
    <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="1" result="n"/>
    <feDiffuseLighting in="n" surfaceScale=".8" lighting-color="#E9E6DF"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>` }
};

// ---------- cube ----------
// oblique view from above-right: front square, top and right faces
const FRONT = "48,82 140,82 140,174 48,174";
const TOP = "48,82 140,82 158,60 66,60";
const SIDE = "140,82 158,60 158,152 140,174";

function cube(m) {
  const u = "c" + (uidN++);
  const s = SURF[m.tex] || SURF.community;
  const face = (pts, shade, name) => `<clipPath id="${u}k${name}"><polygon points="${pts}"/></clipPath>
    <g clip-path="url(#${u}k${name})"><rect x="40" y="50" width="130" height="130" fill="${s.color}" filter="url(#${u}f)" opacity="${s.alpha || 1}"/><polygon points="${pts}" fill="${shade}"/></g>`;
  return `<svg class="specimen" viewBox="20 30 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${m.name}">
    <defs><filter id="${u}f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${s.f}</filter>
      <radialGradient id="${u}sh"><stop offset="0" stop-color="#000000" stop-opacity=".55"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="shadow" cx="104" cy="176" rx="70" ry="8" fill="url(#${u}sh)"/>
    <g class="obj">${face(SIDE, "rgba(0,0,0,.3)", "s")}${face(FRONT, "rgba(0,0,0,.06)", "f")}${face(TOP, "rgba(255,255,255,.14)", "t")}
    <polyline points="48,82 140,82 158,60" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width=".8"/></g>
  </svg>`;
}

// ---------- jar ----------
const CONTENT = {
  orange: u => `<defs><radialGradient id="${u}o" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#F4A45A"/><stop offset=".7" stop-color="#E07F2E"/><stop offset="1" stop-color="#B95E1F"/></radialGradient>
    <filter id="${u}p"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2"/><feDiffuseLighting surfaceScale="1.5" lighting-color="#FFFFFF"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="multiply"/></filter></defs>
    <circle cx="100" cy="135" r="31" fill="url(#${u}o)" filter="url(#${u}p)"/><ellipse cx="89" cy="121" rx="8" ry="5" fill="#FFFFFF" opacity=".28"/>`,
  tomato: u => `<defs><radialGradient id="${u}t" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#E5604E"/><stop offset=".75" stop-color="#BE3A2D"/><stop offset="1" stop-color="#8F2A22"/></radialGradient></defs>
    <path d="M100 106 C128 106 133 124 131 136 C128 156 115 164 100 164 C85 164 72 156 69 136 C67 124 72 106 100 106 Z" fill="url(#${u}t)"/>
    <path d="M100 108 l-5 -6 l5 3 l5 -5 l-1 6 l7 -1 l-7 5 l5 4 l-8 -2 l-1 5 l-1 -6 l-7 1 l6 -4 Z" fill="#6E8050"/><ellipse cx="86" cy="122" rx="7" ry="4" fill="#FFFFFF" opacity=".35"/>`,
  pear: u => `<defs><radialGradient id="${u}r" cx=".35" cy=".45" r=".75"><stop offset="0" stop-color="#DCDB91"/><stop offset=".8" stop-color="#B9B866"/><stop offset="1" stop-color="#8E8C46"/></radialGradient>
    <filter id="${u}k"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .2  0 0 0 -6 3"/><feComposite in2="SourceGraphic" operator="in"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode/></feMerge></filter></defs>
    <path d="M100 100 C107 100 109 110 110 118 C113 130 128 136 128 150 C128 161 116 166 100 166 C84 166 72 161 72 150 C72 136 87 130 90 118 C91 110 93 100 100 100 Z" fill="url(#${u}r)" filter="url(#${u}k)"/>
    <path d="M100 100 q1 -6 5 -9" stroke="#5E4A32" stroke-width="1.5" fill="none"/>`,
  foam: u => `<defs><radialGradient id="${u}b" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DAD8D2"/></radialGradient></defs>
    ${[[84, 150, 15], [104, 146, 18], [122, 152, 13], [92, 130, 13], [112, 128, 12], [102, 113, 10], [76, 160, 8], [128, 161, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u}b)"/>`).join("")}`,
  cream: u => `<defs><linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#E8DFCC"/></linearGradient></defs>
    <path d="M70 166 q-4 -16 12 -18 q-6 -16 12 -18 q-2 -14 8 -20 q5 -6 1 -12 q14 6 12 20 q16 2 12 18 q16 4 10 18 q2 6 -2 12 Z" fill="url(#${u}c)"/>
    <path d="M84 148 q16 6 34 0 M92 130 q10 4 20 0" fill="none" stroke="#D9CFBA" stroke-width="1"/>`
};

const JAR = "M70 90 Q66 92 66 100 V162 Q66 172 78 172 H122 Q134 172 134 162 V100 Q134 92 130 90 Z";
function jar(m, empty = false) {
  const u = "j" + (uidN++);
  const inner = empty ? "" : (CONTENT[m.tex] || CONTENT.foam)(u);
  return `<svg class="specimen" viewBox="20 30 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${empty ? "Empty specimen jar" : m.name}">
    <defs><clipPath id="${u}cl"><path d="${JAR}"/></clipPath>
      <radialGradient id="${u}sh"><stop offset="0" stop-color="#000000" stop-opacity=".5"/><stop offset="1" stop-color="#000000" stop-opacity="0"/></radialGradient>
      <linearGradient id="${u}g" x1="0" x2="1"><stop offset="0" stop-color="#C9D2CF" stop-opacity=".45"/><stop offset=".45" stop-color="#FFFFFF" stop-opacity=".05"/><stop offset="1" stop-color="#AEB9B5" stop-opacity=".4"/></linearGradient></defs>
    <ellipse class="shadow" cx="102" cy="175" rx="46" ry="6" fill="url(#${u}sh)"/>
    <g class="obj"><g clip-path="url(#${u}cl)"><g class="fill">${inner}</g></g>
    <path d="${JAR}" fill="url(#${u}g)" stroke="#F0ECE5" stroke-opacity=".3" stroke-width=".8"/>
    <rect x="73" y="74" width="54" height="17" rx="2" fill="${empty ? "#383635" : "#CDB79A"}" stroke="#F0ECE5" stroke-opacity=".2" stroke-width=".6"/>
    <path d="M74 100 V160" stroke="#FFFFFF" stroke-width="4" opacity=".35" stroke-linecap="round"/></g>
  </svg>`;
}

export function specimenArt(m) {
  if (!m) return "";
  return m.display === "vial" ? jar(m) : cube(m);
}
export const emptyJar = () => jar({ name: "" }, true);

export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#151515"/>${mark().replace(/<\/?svg[^>]*>/g, "")}</svg>`;
