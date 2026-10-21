import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const frac = (x) => x - Math.floor(x);
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const R = rng(7);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

/* ------------------------------------------------------------------ */
/* renderer / scene / camera                                           */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = canvasTex(8, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#3f86d6'); gr.addColorStop(0.55, '#9fd0f2'); gr.addColorStop(0.82, '#f6ecc8'); gr.addColorStop(1, '#cfe3a2');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.fog = new THREE.Fog(0xcfe3d0, 40, 110);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);

// small studio-like environment so metals and glass have something to reflect
{
  const envScene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#bcd8ff'); gr.addColorStop(0.5, '#fff6e4'); gr.addColorStop(1, '#8c7a5c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  }));
  envScene.add(dome);
  [[8, 10, 6, 6], [-9, 8, -4, 4], [0, 12, -9, 5]].forEach(([x, y, z, sz]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sz, 0.4, sz), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    b.position.set(x, y, z); b.material.color.multiplyScalar(6); envScene.add(b);
  });
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(envScene, 0.02).texture;
  scene.environmentIntensity = 0.55;
}

/* lights ------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6a5a3a, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -13; sc.right = 13; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 60;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const potatoLight = new THREE.PointLight(0xffd9a0, 0, 12, 1.6); // glows inside the pipe
scene.add(potatoLight);
const kitchenLight = new THREE.PointLight(0xffe2b0, 0, 40, 1.4);
kitchenLight.position.set(51, 9, 4);
scene.add(kitchenLight);

/* ------------------------------------------------------------------ */
/* constants of the layout                                             */
/* ------------------------------------------------------------------ */
const CT = 1.8;                 // counter top height
const BOARD_TOP = CT + 0.1;     // cutting-board surface
const PX = 43.8;                // potato x on the board
const POT_X = 50, OIL_Y = CT + 0.95;
const CAN_X = 57, CAN_H = 3.0;
const ROLL_Y = 0.6;
const NCHIPS = 24, NSLICES = 12;

/* ------------------------------------------------------------------ */
/* environment                                                         */
/* ------------------------------------------------------------------ */
const grassTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5e9b34'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const l = 30 + Math.random() * 28;
    g.fillStyle = `hsl(${88 + Math.random() * 18},55%,${l}%)`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 5 + Math.random() * 6);
  }
}, [40, 40]);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(108, 70), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
grass.rotation.x = -Math.PI / 2;
grass.position.set(-16, 0, -29);          // x -70..38, z -64..6 (the kitchen floor takes over at x=38)
grass.receiveShadow = true;
scene.add(grass);
const underside = new THREE.Mesh(grass.geometry, new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 1, side: THREE.BackSide }));
underside.rotation.copy(grass.rotation); underside.position.copy(grass.position).add(new THREE.Vector3(0, -0.01, 0));
scene.add(underside);

const dirtTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#5b3d25'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    g.fillStyle = `hsla(${24 + Math.sin(y * 0.03) * 6},38%,${22 + Math.sin(y * 0.021) * 6 + Math.random() * 3}%,.55)`;
    g.fillRect(0, y, w, 4);
  }
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `hsla(${20 + Math.random() * 14},${25 + Math.random() * 25}%,${14 + Math.random() * 26}%,${0.25 + Math.random() * 0.4})`;
    const r = Math.random() * 5 + 1;
    g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, r * 1.4, r, 0, 0, 7); g.fill();
  }
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `hsl(32,${8 + Math.random() * 10}%,${42 + Math.random() * 25}%)`;
    const r = 5 + Math.random() * 14;
    g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, r, r * 0.7, Math.random() * 3, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(210,190,150,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    g.beginPath(); let x = Math.random() * w, y = Math.random() * h * 0.5; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 40; y += 18 + Math.random() * 26; g.lineTo(x, y); }
    g.stroke();
  }
}, [15, 2.2]);
const dirtWall = new THREE.Mesh(new THREE.PlaneGeometry(119, 16), new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1 }));
dirtWall.position.set(-14.5, -8, -1.6);
dirtWall.receiveShadow = true;
scene.add(dirtWall);
// lower pit: darker band so the underground stays moody
const pitShade = new THREE.Mesh(new THREE.PlaneGeometry(112, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 }));
pitShade.position.set(-18, -8, -1.55);
scene.add(pitShade);

/* hills + clouds ----------------------------------------------------- */
const hillMat = new THREE.MeshStandardMaterial({ color: 0x6fae4a, roughness: 1 });
[[-30, -3, -50, 26, 9], [-4, -4, -58, 34, 12], [28, -3, -54, 28, 8], [-60, -3, -44, 22, 7]].forEach(([x, y, z, r, h]) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), hillMat);
  m.scale.set(r, h, r * 0.7); m.position.set(x, y, z); scene.add(m);
});
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
const clouds = [];
for (let i = 0; i < 9; i++) {
  const cg = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), cloudMat);
    s.scale.set(2.2 + R() * 1.6, 1.1 + R() * 0.6, 1.2); s.position.set(k * 1.9 - 4 + R(), R() * 0.7, R());
    cg.add(s);
  }
  cg.position.set(-50 + i * 16 + R() * 6, 17 + R() * 8, -45 - R() * 10);
  scene.add(cg); clouds.push(cg);
}

/* potato field ------------------------------------------------------- */
const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x6a4527, roughness: 1 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8a2c, roughness: 0.8 });
const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x57a63a, roughness: 0.8 });
const ridgeZ = [-1.0, 0, 1.7, 3.4, 5.1, -2.6, -4.2, -5.8, -7.4, -9, -11, -13, -15, -17];
ridgeZ.forEach((z, ri) => {
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 1, 24, 1), ridgeMat);
  ridge.geometry.rotateZ(Math.PI / 2);
  ridge.scale.set(z === 0 ? 36 : 26, z === 0 ? 0.4 : 0.34, 1);
  ridge.position.set(z === 0 ? -8.6 : -13.6, 0.04, z);
  ridge.receiveShadow = true; ridge.castShadow = true;
  scene.add(ridge);
  if (z > 2) return;
  for (let x = -26; x < 4.8; x += 1.35 + R() * 0.2) {
    if (z === 0 && x > -1.3) continue;
    const g = new THREE.Group();
    const n = 5 + Math.floor(R() * 4);
    for (let k = 0; k < n; k++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), (k % 2 ? leafMat : leafMat2));
      l.scale.set(1.2, 0.5, 0.8);
      const a = (k / n) * Math.PI * 2 + R();
      l.position.set(Math.cos(a) * 0.26, 0.2 + R() * 0.2, Math.sin(a) * 0.26);
      l.rotation.set(R() * 0.8, a, R() * 0.7);
      l.castShadow = true;
      g.add(l);
    }
    g.position.set(x + R() * 0.3, 0.2, z);
    scene.add(g);
  }
});
// harvest hole + soil heap where the potato sits
const heap = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), ridgeMat);
heap.scale.set(1.15, 0.28, 0.9); heap.position.set(0, 0.08, 0); heap.castShadow = heap.receiveShadow = true;
scene.add(heap);
const clods = [];
for (let i = 0; i < 9; i++) {
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + R() * 0.1, 0), ridgeMat);
  c.position.set((R() - 0.5) * 2.2, 0.35 + R() * 0.1, (R() - 0.5) * 1.3);
  c.rotation.set(R() * 3, R() * 3, R() * 3); c.castShadow = true;
  scene.add(c); clods.push(c);
}

/* pipe --------------------------------------------------------------- */
const pipePts = [
  [5.2, ROLL_Y, 0], [6.3, ROLL_Y - 0.05, 0], [7.3, -0.7, 0], [8.1, -2.3, 0], [9.6, -3.3, 0],
  [13, -3.4, 0], [16, -2.4, 0], [18.2, -3.4, 0], [22, -3.5, 0], [26, -2.6, 0], [29, -3.4, 0],
  [33, -3.4, 0], [35.6, -2.6, 0], [37.4, -0.7, 0], [38.7, 1.9, 0], [39.8, 3.3, 0], [41.5, 3.62, 0],
].map((a) => new THREE.Vector3(...a));
const pipeCurve = new THREE.CatmullRomCurve3(pipePts, false, 'catmullrom', 0.5);
const PIPE_LEN = pipeCurve.getLength();
const PIPE_R = 0.78;
const pipeMat = new THREE.MeshPhysicalMaterial({
  color: 0xbfe0ee, transparent: true, opacity: 0.3, roughness: 0.08, metalness: 0, side: THREE.DoubleSide,
  depthWrite: false, clearcoat: 1, envMapIntensity: 1,
});
const pipe = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 480, PIPE_R, 28, false), pipeMat);
pipe.renderOrder = 3;
scene.add(pipe);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x8b98a6, metalness: 0.85, roughness: 0.3 });
for (let d = 0; d <= PIPE_LEN; d += 2.1) {
  const u = d / PIPE_LEN;
  const pt = pipeCurve.getPointAt(u), tg = pipeCurve.getTangentAt(u);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(PIPE_R + 0.02, 0.07, 10, 36), ringMat);
  ring.position.copy(pt);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
  ring.castShadow = true;
  scene.add(ring);
}
// hopper at the pipe mouth
const hopper = new THREE.Mesh(new THREE.TorusGeometry(PIPE_R + 0.12, 0.13, 12, 40), new THREE.MeshStandardMaterial({ color: 0xd9a21b, metalness: 0.6, roughness: 0.35 }));
hopper.position.copy(pipePts[0]).add(new THREE.Vector3(-0.15, 0, 0));
hopper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pipeCurve.getTangentAt(0));
scene.add(hopper);
const spoutRing = hopper.clone(); spoutRing.position.copy(pipePts[pipePts.length - 1]); spoutRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pipeCurve.getTangentAt(1));
scene.add(spoutRing);

/* ------------------------------------------------------------------ */
/* kitchen                                                             */
/* ------------------------------------------------------------------ */
const KX0 = 38, KX1 = 66;
const tileTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e8efe9'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
    const ox = (y % 2) * 64;
    g.fillStyle = `hsl(${165 + Math.random() * 8},${22 + Math.random() * 8}%,${82 + Math.random() * 6}%)`;
    g.fillRect(x * 128 + ox + 3, y * 64 + 3, 122, 58);
  }
}, [14, 4]);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(KX1 - KX0, 11), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 }));
wall.position.set((KX0 + KX1) / 2, 5.5, -2.2); wall.receiveShadow = true;
scene.add(wall);
const floorTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b98f5a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = `hsl(${30 + i * 2},45%,${44 + i * 3}%)`; g.fillRect(0, i * 64, w, 62); }
  g.fillStyle = 'rgba(60,35,10,.35)'; for (let i = 0; i < 4; i++) g.fillRect(0, i * 64 + 62, w, 2);
}, [10, 4]);
const kfloor = new THREE.Mesh(new THREE.PlaneGeometry(KX1 - KX0, 12), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }));
kfloor.rotation.x = -Math.PI / 2; kfloor.position.set((KX0 + KX1) / 2, 0, 3.8); kfloor.receiveShadow = true;
scene.add(kfloor);

const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a6a3b, roughness: 0.6 });
const counter = new THREE.Mesh(new THREE.BoxGeometry(KX1 - 40.4, CT, 3.8), new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.5 }));
counter.position.set((KX1 + 40.4) / 2, CT / 2, -0.3); counter.castShadow = counter.receiveShadow = true;
scene.add(counter);
const counterTop = new THREE.Mesh(new THREE.BoxGeometry(KX1 - 40.4 + 0.2, 0.12, 4.0), woodMat);
counterTop.position.set((KX1 + 40.4) / 2, CT - 0.06, -0.3); counterTop.receiveShadow = counterTop.castShadow = true;
scene.add(counterTop);
// cabinet doors
for (let x = 41.4; x < KX1 - 1; x += 2.6) {
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.3, CT - 0.5, 0.06), new THREE.MeshStandardMaterial({ color: 0xdfe8e4, roughness: 0.5 }));
  door.position.set(x, CT / 2 - 0.05, 1.62); scene.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshStandardMaterial({ color: 0xb9b9b9, metalness: 1, roughness: 0.25 }));
  knob.position.set(x + 0.8, CT - 0.7, 1.7); scene.add(knob);
}
// wall shelf with jars + window
const shelf = new THREE.Mesh(new THREE.BoxGeometry(9, 0.14, 1.0), woodMat);
shelf.position.set(61, 6.3, -1.6); shelf.castShadow = true; scene.add(shelf);
for (let i = 0; i < 6; i++) {
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.8 + (i % 3) * 0.2, 16),
    new THREE.MeshStandardMaterial({ color: [0xd9534f, 0xe5a93c, 0x6aa84f, 0xf0e2b0, 0xb0562c, 0x8b6ab0][i], roughness: 0.2, transparent: true, opacity: 0.88 }));
  jar.position.set(57.7 + i * 1.3, 6.37 + (0.8 + (i % 3) * 0.2) / 2, -1.6); jar.castShadow = true; scene.add(jar);
}
const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
windowFrame.position.set(45, 6.2, -2.12); scene.add(windowFrame);
const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.3), new THREE.MeshBasicMaterial({ color: 0xcfeaff }));
windowGlass.position.set(45, 6.2, -2.05); scene.add(windowGlass);
const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 0.08), windowFrame.material); bar.position.set(45, 6.2, -2.0); scene.add(bar);
const bar2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.08), windowFrame.material); bar2.position.set(45, 6.2, -2.0); scene.add(bar2);
// hanging lamp over the stove
const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.7, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x2c3a46, roughness: 0.4, side: THREE.DoubleSide }));
lamp.position.set(POT_X, 8.3, 0); scene.add(lamp);
const lampCord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
lampCord.position.set(POT_X, 10.2, 0); scene.add(lampCord);

// cutting board
const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 2.2), new THREE.MeshStandardMaterial({ color: 0xc89a5e, roughness: 0.7 }));
board.position.set(PX, CT + 0.07, 0.05); board.castShadow = board.receiveShadow = true; scene.add(board);

// stove + pot
const burner = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.1, 40), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5, emissive: 0xff4a10, emissiveIntensity: 0 }));
burner.position.set(POT_X, CT + 0.05, 0); burner.receiveShadow = true; scene.add(burner);
const potMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cb, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide });
const potBody = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.22, 1.15, 48, 1, true), potMat);
potBody.position.set(POT_X, CT + 0.1 + 0.575, 0); potBody.castShadow = potBody.receiveShadow = true; scene.add(potBody);
const potBottom = new THREE.Mesh(new THREE.CircleGeometry(1.22, 40), potMat);
potBottom.rotation.x = -Math.PI / 2; potBottom.position.set(POT_X, CT + 0.12, 0); scene.add(potBottom);
const potRim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.06, 10, 48), potMat);
potRim.rotation.x = Math.PI / 2; potRim.position.set(POT_X, CT + 0.1 + 1.15, 0); scene.add(potRim);
for (const s of [-1, 1]) {
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 }));
  h.position.set(POT_X + s * 1.38, CT + 0.1 + 0.95, 0); h.rotation.set(0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2); scene.add(h);
}
const oil = new THREE.Mesh(new THREE.CircleGeometry(1.27, 48), new THREE.MeshStandardMaterial({
  color: 0xd9901a, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.92, emissive: 0x7a3a00, emissiveIntensity: 0.25,
}));
oil.rotation.x = -Math.PI / 2; oil.position.set(POT_X, OIL_Y, 0); scene.add(oil);

// bubbles + steam
const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xfff1c9, roughness: 0.1, transparent: true, opacity: 0.8 });
const bubbles = [];
for (let i = 0; i < 46; i++) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bubbleMat);
  const a = R() * 7, r = Math.sqrt(R()) * 1.12;
  b.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, ph: R(), sp: 40 + R() * 40 };
  b.visible = false; scene.add(b); bubbles.push(b);
}
const steam = [];
for (let i = 0; i < 16; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  m.userData = { x: (R() - 0.5) * 1.6, z: (R() - 0.5) * 1.2, ph: R(), sp: 5 + R() * 4 };
  m.visible = false; scene.add(m); steam.push(m);
}

/* ------------------------------------------------------------------ */
/* the potato                                                          */
/* ------------------------------------------------------------------ */
const potatoGeo = new THREE.IcosahedronGeometry(0.5, 5);
{
  const pos = potatoGeo.attributes.position, col = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 5.1 + 1.3) * Math.sin(v.y * 4.3 + 0.7) * Math.sin(v.z * 4.9 + 2.1);
    const n2 = Math.sin(v.x * 11 + v.z * 7) * Math.sin(v.y * 9 - v.x * 5);
    v.multiplyScalar(1 + 0.09 * n + 0.02 * n2);
    pos.setXYZ(i, v.x, v.y, v.z);
    const c = 0.82 + 0.12 * n2 + 0.08 * n;
    col.push(c, c, c);
  }
  potatoGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  potatoGeo.computeVertexNormals();
}
const SKIN = new THREE.Color(0xa4783f), FLESH = new THREE.Color(0xf0dc90);
const potatoMat = new THREE.MeshStandardMaterial({ color: SKIN.clone(), roughness: 0.82, vertexColors: true });
const potato = new THREE.Group();
const potatoBody = new THREE.Mesh(potatoGeo, potatoMat);
potatoBody.scale.set(1.3, 0.85, 0.95); potatoBody.castShadow = true; potatoBody.receiveShadow = true;
potato.add(potatoBody);
const eyes = [];
for (let i = 0; i < 12; i++) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 1 }));
  const th = R() * Math.PI * 2, ph = Math.acos(2 * R() - 1);
  e.position.set(Math.sin(ph) * Math.cos(th) * 0.5 * 1.3, Math.cos(ph) * 0.5 * 0.85, Math.sin(ph) * Math.sin(th) * 0.5 * 0.95).multiplyScalar(0.985);
  e.scale.setScalar(0.8 + R()); potato.add(e); eyes.push(e);
}
scene.add(potato);

/* peel strips ------------------------------------------------------- */
function ribbonGeo(len, wid, curl) {
  const segs = 10, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, a = (t - 0.5) * curl;
    const x = Math.sin(a) * len / curl, y = (1 - Math.cos(a)) * len / curl * 0.6;
    pos.push(x, y, -wid / 2, x, y, wid / 2);
    if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const peelMat = new THREE.MeshStandardMaterial({ color: 0x9a6f3a, roughness: 0.9, side: THREE.DoubleSide });
const strips = [];
for (let i = 0; i < 15; i++) {
  const m = new THREE.Mesh(ribbonGeo(0.8 + R() * 0.5, 0.14 + R() * 0.06, 2.4 + R() * 1.5), peelMat);
  m.castShadow = true; m.visible = false;
  m.userData = {
    t0: 0.05 + i * 0.058, sx: PX + (R() - 0.5) * 0.9, sz: 0.42 + R() * 0.15,
    ex: PX + (R() - 0.5) * 3.0, ez: (R() - 0.5) * 1.6, ry: R() * 6, rz: (R() - 0.5) * 2,
  };
  scene.add(m); strips.push(m);
}

/* peeler + knife ----------------------------------------------------- */
const steel = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, metalness: 0.9, roughness: 0.25 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0xc4262b, roughness: 0.45 });
const peeler = new THREE.Group();
{
  const bl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), steel); bl.position.set(0, 0, 0);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 1.0, 12), handleMat); hd.rotation.z = Math.PI / 2; hd.position.set(0.7, 0.05, 0);
  peeler.add(bl, hd); peeler.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
peeler.visible = false; scene.add(peeler);
const knife = new THREE.Group();
{
  const bl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 1.5), steel);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.95), handleMat); hd.position.set(0, 0.52, 0.78);
  bl.position.set(0, 0, 0); knife.add(bl, hd);
  knife.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
knife.rotation.y = 0.7; knife.visible = false; scene.add(knife);

/* chips (slices) -------------------------------------------------- */
function makeChipGeometry(rings = 8, segs = 56, half = 0.03) {
  const pos = [], nor = [], idx = [];
  const ringStart = (side) => side * (1 + rings * segs);
  for (const s of [1, -1]) {
    pos.push(0, s * half, 0); nor.push(0, s, 0);
    for (let r = 1; r <= rings; r++) for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2, rad = r / rings;
      pos.push(Math.cos(a) * rad, s * half, Math.sin(a) * rad); nor.push(0, s, 0);
    }
  }
  const at = (side, r, k) => ringStart(side) + 1 + (r - 1) * segs + (k % segs);
  for (let side = 0; side < 2; side++) {
    const flip = side === 1;
    for (let k = 0; k < segs; k++) {
      const c = ringStart(side), a = at(side, 1, k), b = at(side, 1, k + 1);
      flip ? idx.push(c, a, b) : idx.push(c, b, a);
      for (let r = 1; r < rings; r++) {
        const p0 = at(side, r, k), p1 = at(side, r, k + 1), p2 = at(side, r + 1, k), p3 = at(side, r + 1, k + 1);
        flip ? idx.push(p0, p2, p1, p1, p2, p3) : idx.push(p0, p1, p2, p1, p3, p2);
      }
    }
  }
  const base = pos.length / 3;
  for (let k = 0; k <= segs; k++) {
    const a = (k / segs) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    pos.push(cx, half, sz, cx, -half, sz); nor.push(cx, 0, sz, cx, 0, sz);
  }
  for (let k = 0; k < segs; k++) {
    const i0 = base + k * 2;
    idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
const chipGeo = makeChipGeometry();
const curlU = { value: 0 };
const CURL_K = 0.16;
function chipMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: FLESH.clone(), roughness: 0.55, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCurl = curlU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uCurl;')
      .replace('#include <beginnormal_vertex>', `
        vec3 objectNormal = vec3(normal);
        vec3 sn = normalize(vec3(-2.0 * ${CURL_K.toFixed(3)} * uCurl * position.x, 1.0, 2.0 * ${CURL_K.toFixed(3)} * uCurl * position.z));
        if (normal.y > 0.5) objectNormal = sn; else if (normal.y < -0.5) objectNormal = -sn;
      `)
      .replace('#include <begin_vertex>', `
        vec3 transformed = vec3(position);
        transformed.y += ${CURL_K.toFixed(3)} * uCurl * (position.x * position.x - position.z * position.z);
      `);
  };
  m.customProgramCacheKey = () => 'chipcurl';
  return m;
}
const chips = [];
const chipGroup = new THREE.Group(); scene.add(chipGroup);
for (let i = 0; i < NCHIPS; i++) {
  const m = new THREE.Mesh(chipGeo, chipMaterial());
  m.castShadow = true; m.receiveShadow = true; m.visible = false;
  m.userData = { i, tone: R(), a0: R() * 6.28 };
  chipGroup.add(m); chips.push(m);
}

/* the can ------------------------------------------------------------ */
const labelTex = canvasTex(2048, 1480, (g, w, h) => {
  g.fillStyle = '#c4262b'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.2)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f5c542'; g.fillRect(0, 0, w, 120); g.fillRect(0, h - 120, w, 120);
  g.fillStyle = '#fff4d6'; g.textAlign = 'center';
  g.font = '800 200px Helvetica, Arial, sans-serif'; g.fillText('CRISPA', w / 2, 520);
  g.font = '700 74px Helvetica, Arial, sans-serif'; g.fillText('ORIGINAL', w / 2, 640);
  g.fillStyle = '#f5c542'; g.beginPath(); g.ellipse(w / 2, 860, 190, 120, -0.3, 0, 7); g.fill();
  g.fillStyle = '#c4262b'; g.beginPath(); g.ellipse(w / 2 + 40, 830, 46, 28, -0.3, 0, 7); g.fill();
  g.beginPath(); g.ellipse(w / 2 - 70, 890, 30, 18, 0.5, 0, 7); g.fill();
  g.fillStyle = '#fff4d6'; g.font = '600 64px Helvetica, Arial, sans-serif'; g.fillText('100 % pommes de terre', w / 2, 1130);
  g.font = '600 52px Helvetica, Arial, sans-serif'; g.fillText('croustillantes à souhait', w / 2, 1215);
});
labelTex.offset.x = 0.5; labelTex.wrapS = THREE.RepeatWrapping;
const can = new THREE.Group();
const canR = 0.66;
const canBody = new THREE.Mesh(new THREE.CylinderGeometry(canR, canR, CAN_H, 56, 1, true), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.45, metalness: 0.1 }));
canBody.position.y = CAN_H / 2; canBody.castShadow = true; canBody.receiveShadow = true;
const canBottom = new THREE.Mesh(new THREE.CylinderGeometry(canR + 0.02, canR + 0.02, 0.1, 40), new THREE.MeshStandardMaterial({ color: 0xcfd5da, metalness: 1, roughness: 0.3 }));
canBottom.position.y = 0.05;
const canInner = new THREE.Mesh(new THREE.CylinderGeometry(canR - 0.02, canR - 0.02, CAN_H, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8a064, roughness: 0.8, side: THREE.BackSide }));
canInner.position.y = CAN_H / 2;
const canRim = new THREE.Mesh(new THREE.TorusGeometry(canR, 0.035, 8, 56), new THREE.MeshStandardMaterial({ color: 0xcfd5da, metalness: 1, roughness: 0.3 }));
canRim.rotation.x = Math.PI / 2; canRim.position.y = CAN_H;
can.add(canBody, canBottom, canInner, canRim);
can.position.set(CAN_X, CT, 0);
scene.add(can);
const lid = new THREE.Mesh(new THREE.CylinderGeometry(canR + 0.04, canR + 0.04, 0.2, 48), new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.4 }));
lid.castShadow = true; lid.visible = false; scene.add(lid);
const lidTab = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: 0.4 }));
lidTab.rotation.x = Math.PI / 2; lidTab.position.y = 0.11; lid.add(lidTab);

/* the glove ---------------------------------------------------------- */
const glove = new THREE.Group();
const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf0b90b, roughness: 0.75 });
{
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), gloveMat); palm.scale.set(1, 0.55, 1); palm.castShadow = true; glove.add(palm);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.38, 20), new THREE.MeshStandardMaterial({ color: 0x2e5aa8, roughness: 0.8 }));
  cuff.position.y = 0.38; cuff.castShadow = true; glove.add(cuff);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 20), new THREE.MeshStandardMaterial({ color: 0x2e5aa8, roughness: 0.85 }));
  arm.position.y = 4.9; arm.castShadow = true; glove.add(arm);
}
const fingers = [];
for (let i = 0; i < 5; i++) {
  const pivot = new THREE.Group();
  const phi = (i / 5) * Math.PI * 2 + 0.3;
  pivot.position.set(Math.cos(phi) * 0.27, -0.04, Math.sin(phi) * 0.27);
  pivot.rotation.y = -phi;
  const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.42, 6, 10), gloveMat);
  f.position.y = -0.27; f.castShadow = true;
  pivot.add(f); glove.add(pivot); fingers.push(pivot);
}
glove.visible = false; scene.add(glove);

/* ------------------------------------------------------------------ */
/* potato choreography                                                 */
/* ------------------------------------------------------------------ */
const T = { field0: 0.045, grab: 0.062, lift: 0.084, rel: 0.092, fall: 0.094, roll0: 0.112, pipe0: 0.138, pipe1: 0.338, out1: 0.378 };
const potatoPos = new THREE.Vector3(), potatoRot = new THREE.Euler(), restY = (s) => BOARD_TOP + 0.425 * s;
function potatoState(p, s = 1) {
  const pos = potatoPos, rot = potatoRot;
  rot.set(0, 0, 0);
  if (p < T.lift) {
    const k = sm(seg(p, T.grab, T.lift));
    pos.set(0, lerp(0.18, 1.7, k), 0); rot.set(0.1 * k, 0.3 + 0.6 * k, 0.1);
  } else if (p < T.roll0) {
    const u = (p - T.fall) / (T.roll0 - T.fall);
    const fallEnd = 0.6;
    if (p < T.fall) pos.set(0, 1.7, 0);
    else if (u < fallEnd) { const q = u / fallEnd; pos.set(0.1 * q, lerp(1.7, ROLL_Y, q * q), 0); }
    else { const v = (u - fallEnd) / (1 - fallEnd); pos.set(0.1 + 0.25 * v, ROLL_Y + 0.32 * 4 * v * (1 - v), 0); }
    rot.set(0.1, 0.9 + u * 2, 0.1 - u * 1.2);
  } else if (p < T.pipe0) {
    const u = seg(p, T.roll0, T.pipe0), x = lerp(0.35, pipePts[0].x, u * u * (0.4 + 0.6 * u));
    pos.set(x, ROLL_Y, 0); rot.set(0, 0.2, -(x - 0.35) / 0.45);
  } else if (p < T.pipe1) {
    const t = seg(p, T.pipe0, T.pipe1), u = lerp(t, sm(t), 0.35);
    pipeCurve.getPointAt(clamp(u), pos);
    rot.set(0, 0.2, -(pipePts[0].x - 0.35) / 0.45 - u * PIPE_LEN / 0.45);
  } else if (p < T.out1) {
    const tau = seg(p, T.pipe1, T.out1), end = pipePts[pipePts.length - 1];
    const ty = restY(1);
    pos.set(lerp(end.x, PX, tau), lerp(end.y, ty, tau * tau), 0);
    const bounce = tau > 0.96 ? 0 : 0;
    pos.y += bounce;
    rot.set(0, 0.2 + tau, -(pipePts[0].x - 0.35) / 0.45 - PIPE_LEN / 0.45 - tau * 3.2);
  } else {
    pos.set(PX, restY(s), 0); rot.set(0, 0, 0);
  }
  return pos;
}

/* ------------------------------------------------------------------ */
/* camera path                                                         */
/* ------------------------------------------------------------------ */
const camKeys = [];   // [p, cam(x,y,z), look(x,y,z)]
const K = (p, c, l) => camKeys.push({ p, c: new THREE.Vector3(...c), l: new THREE.Vector3(...l) });
K(0.000, [-4.5, 3.2, 10.5], [0.6, 0.6, 0]);
K(0.040, [0.6, 2.3, 6.4], [0, 0.7, 0]);
K(0.075, [1.2, 2.7, 6.6], [0, 1.0, 0]);
K(0.105, [2.2, 1.7, 7.2], [1.6, 0.7, 0]);
K(0.132, [5.2, 1.5, 6.4], [5.4, 0.5, 0]);
// follow the potato through the pipe (sampled)
for (let p = 0.14; p <= 0.34 + 1e-6; p += 0.008) {
  const q = potatoState(p).clone();
  const t = clamp(seg(p, T.pipe0, T.pipe1) + 0.02);
  const ahead = pipeCurve.getPointAt(clamp(lerp(t, sm(t), 0.35) + 0.015));
  K(p, [q.x + 0.2 + (ahead.x - q.x) * 0.4, q.y + 0.3, 6.4], [q.x + (ahead.x - q.x) * 0.45, q.y + (ahead.y - q.y) * 0.45, 0]);
}
K(0.360, [40.5, 3.4, 9], [42, 2.6, 0]);
K(0.395, [44.2, 3.8, 6.2], [44, 2.5, 0]);
K(0.520, [44.4, 3.6, 5.6], [44.4, 2.4, 0]);
K(0.585, [47.2, 5.2, 8.8], [47.6, 3.5, 0]);
K(0.650, [49.6, 5.2, 8.2], [50, 3.6, 0]);
K(0.770, [50.6, 5.0, 6.4], [50.4, 2.7, 0]);
K(0.810, [53, 5.4, 10.5], [53.6, 4.2, 0]);
K(0.860, [56.2, 5.2, 8.2], [57, 4.0, 0]);
K(0.900, [58, 4.6, 9.6], [58.3, 3.4, 0]);
K(1.000, [58.2, 3.9, 6.6], [58.5, 3.3, 0]);
camKeys.sort((a, b) => a.p - b.p);
const _c = new THREE.Vector3(), _l = new THREE.Vector3();
function camAt(p, outC, outL) {
  let i = 0; while (i < camKeys.length - 2 && p > camKeys[i + 1].p) i++;
  const a = camKeys[i], b = camKeys[i + 1];
  const t = sm(seg(p, a.p, b.p)), tl = seg(p, a.p, b.p);
  const w = p < 0.13 || p > 0.345 ? t : lerp(tl, t, 0.3);
  outC.lerpVectors(a.c, b.c, w); outL.lerpVectors(a.l, b.l, w);
}
function smoothCam(p) {
  const d = 0.012; let n = 0; const C = new THREE.Vector3(), L = new THREE.Vector3();
  for (let k = -3; k <= 3; k++) { camAt(clamp(p + (k * d) / 3), _c, _l); C.add(_c); L.add(_l); n++; }
  camera.position.copy(C.divideScalar(n)); _l.copy(L.divideScalar(n)); camera.lookAt(_l);
}

/* ------------------------------------------------------------------ */
/* update(p) — everything is a pure function of the scroll progress    */
/* ------------------------------------------------------------------ */
const PALE = new THREE.Color(0xf2e3a4), GOLD = new THREE.Color(0xd8942a), DEEP = new THREE.Color(0xc07a1c);
const peelP = [0.40, 0.52], sliceP = [0.52, 0.585], carryP = [0.585, 0.65], fryP = [0.65, 0.78], packP = [0.78, 0.86], lidP = [0.86, 0.9];
const slices = (() => { // geometry of the peeled potato along x
  const s = 0.93, a = 0.65 * s, b = 0.425 * s, c = 0.475 * s, dx = (2 * a) / NSLICES;
  return { s, a, b, c, dx };
})();
const potTargets = chips.map((_, i) => {
  const rr = 0.9 * Math.sqrt((i + 0.5) / NCHIPS), an = i * 2.39996;
  return { x: Math.cos(an) * rr, z: Math.sin(an) * rr, layer: i % 3, an };
});
const canY = (i) => CT + 0.18 + i * 0.07;

function slicePose(i, sp) {
  // standing disc i of the potato cut by the knife (stack along x)
  const { a, b, c, dx } = slices;
  const xi = -a + (i + 0.5) * dx, f = Math.sqrt(Math.max(0.02, 1 - (xi / a) * (xi / a)));
  const cutAt = (NSLICES - i - 0.5) / (NSLICES - 1) * 0.92 + 0.04;
  const g = i === 0 ? 0 : sm(seg(sp, cutAt, cutAt + 0.1));
  return {
    x: PX + xi + g * (0.05 + 0.03 * i), y: restY(slices.s) - 0.0 + 0.0, z: 0,
    sy: b * f, sz: c * f, thick: (dx * 0.97) / 0.06, lean: -g * 0.28 * (i / NSLICES), f,
  };
}

const state = { p: 0 };
function update(p) {
  state.p = p;
  // --- sky / drift
  clouds.forEach((c, i) => { c.position.x = ((-50 + i * 16 + p * 25 + 80) % 160) - 80 + 20; });
  scene.fog.color.set(p > 0.34 ? 0x2a2018 : 0xcfe3d0);
  scene.fog.near = p > 0.14 && p < 0.34 ? 14 : 40; scene.fog.far = p > 0.14 && p < 0.34 ? 46 : 110;

  // --- glove
  const gl = { y: 8, curl: 0, vis: false };
  const gx = 0, potY0 = 0.18;
  if (p > 0.04 && p < 0.112) {
    gl.vis = true;
    const d = sm(seg(p, 0.04, 0.058)), up = sm(seg(p, T.grab, T.lift)), leave = sm(seg(p, 0.094, 0.108));
    const potY = potatoState(Math.min(p, T.lift)).y;
    gl.y = lerp(8, potY + 0.62, d) + leave * 8;
    if (p < T.lift) gl.y = lerp(lerp(8, potY0 + 0.62, d), potY + 0.62, up);
    gl.curl = sm(seg(p, 0.056, 0.064)) * (1 - sm(seg(p, 0.088, 0.094)));
  }
  glove.visible = gl.vis;
  glove.position.set(gx, gl.y, 0.0);
  glove.rotation.set(0, 0.2, -0.12);
  fingers.forEach((f, i) => { f.children[0].rotation.set(0, 0, 0); f.rotation.z = lerp(0.55, -0.42, gl.curl); });
  heap.visible = true;
  clods.forEach((c, i) => { c.position.y = 0.3 + (p > 0.07 ? 0.0 : 0.04); });

  // --- potato
  const peelK = sm(seg(p, peelP[0] + 0.005, peelP[1] - 0.005));
  const sc = lerp(1, slices.s, peelK);
  const pos = potatoState(p, sc);
  potato.position.copy(pos); potato.rotation.copy(potatoRot); potato.scale.setScalar(p >= T.out1 ? sc : 1);
  potatoMat.color.copy(SKIN).lerp(FLESH, peelK);
  eyes.forEach((e) => { e.visible = peelK < 0.35; });
  const slicing = p >= sliceP[0];
  potato.visible = !slicing;
  if (p >= peelP[0] && p < sliceP[0]) { // spin on the board while peeling
    const pe = seg(p, peelP[0], peelP[1]);
    potato.rotation.set(0.0, pe * Math.PI * 7, 0.0);
  }
  if (p >= sliceP[0] - 0.0005) potato.rotation.set(0, 0, 0);

  // pipe glow
  potatoLight.intensity = p > T.pipe0 - 0.01 && p < T.pipe1 + 0.01 ? 8 : 0;
  potatoLight.position.set(pos.x, pos.y + 0.6, 2.2);
  kitchenLight.intensity = sm(seg(p, 0.33, 0.37)) * 220;
  hemi.intensity = p > 0.15 && p < 0.34 ? 0.55 : 0.85;
  sun.intensity = p > 0.15 && p < 0.34 ? 2.0 : 2.6;
  sun.color.set(p >= 0.34 ? 0xfff2dd : 0xfff0d0);

  // --- peel
  const pe = seg(p, peelP[0], peelP[1]);
  strips.forEach((m) => {
    const u = m.userData, sp = (pe - u.t0) / 0.1;
    if (p < peelP[0] || sp < 0) { m.visible = false; return; }
    m.visible = true;
    const t = clamp(sp), fall = t * t;
    const y0 = restY(sc) + 0.25, yb = BOARD_TOP + 0.02;
    m.position.set(lerp(u.sx, u.ex, sm(t)), lerp(y0, yb, fall), lerp(u.sz, u.ez, sm(t)));
    m.rotation.set(0.4 + t * 1.5, u.ry * t + 0.5, u.rz * t);
  });
  const peelActive = p > peelP[0] - 0.006 && p < peelP[1] + 0.004;
  peeler.visible = peelActive;
  if (peelActive) {
    const ap = sm(seg(p, peelP[0] - 0.006, peelP[0] + 0.004)) * (1 - sm(seg(p, peelP[1] - 0.004, peelP[1] + 0.004)));
    const sw = Math.sin(pe * Math.PI * 2 * 7);
    peeler.position.set(PX + 0.1 + 0.05 * sw, restY(sc) + 0.12 + 0.18 * sw + (1 - ap) * 1.2, 0.62);
    peeler.rotation.set(0.1, -0.3, -0.5 + 0.3 * sw);
    peeler.scale.setScalar(ap);
  }

  // --- slicing
  const sp = seg(p, sliceP[0], sliceP[1]);
  const knifeActive = p >= sliceP[0] && p < sliceP[1] + 0.012;
  knife.visible = knifeActive;
  if (knifeActive) {
    const k = clamp(sp * (NSLICES - 1), 0, NSLICES - 1 - 1e-4), n = Math.floor(k), f = k - n;
    const cutIdx = NSLICES - 1 - n; // disc being separated (right to left)
    const xCut = PX + (-slices.a + cutIdx * slices.dx);
    const ap = sm(seg(p, sliceP[0], sliceP[0] + 0.004)) * (1 - sm(seg(p, sliceP[1] - 0.002, sliceP[1] + 0.012)));
    const dip = Math.sin(Math.PI * f);
    knife.position.set(xCut, restY(slices.s) + 0.45 + (1 - dip) * 1.0 + (1 - ap) * 2.5, 0.0);
    knife.rotation.set(0, 0.7, 0);
  }

  // --- chips
  let curl = 0, fryK = 0;
  if (p >= fryP[0]) { fryK = seg(p, fryP[0], fryP[1]); curl = sm(seg(p, fryP[0] + 0.012, fryP[1] - 0.02)); }
  if (p >= packP[0]) curl = 1;
  curlU.value = curl;
  const tone = sm(fryK);
  chips.forEach((m, i) => {
    const d = m.userData;
    const isSlice = i < NSLICES;
    let vis = false;
    const tgt = potTargets[i];
    const potXZ = (swirl) => {
      const an = tgt.an + swirl, rr = Math.hypot(tgt.x, tgt.z);
      return [POT_X + Math.cos(an) * rr, Math.sin(an) * rr];
    };
    const swirlA = fryK * 1.1 * (0.6 + (i % 5) * 0.12);
    const bob = Math.sin(p * 90 + i) * 0.012;
    const potY = OIL_Y + 0.025 + tgt.layer * 0.035 + bob;
    if (isSlice && p >= sliceP[0] && p < carryP[0]) {
      vis = true;
      const q = slicePose(i, sp);
      m.position.set(q.x, q.y, q.z);
      m.rotation.set(0, 0, Math.PI / 2 + q.lean);
      m.scale.set(q.sy, q.thick, q.sz);
    } else if (isSlice && p >= carryP[0]) {
      const t0 = carryP[0] + (NSLICES - 1 - i) * 0.0035, t = seg(p, t0, t0 + 0.03);
      vis = true;
      const q = slicePose(i, 1);
      const [tx, tz] = potXZ(0);
      if (t < 1) {
        const e = sm(t);
        m.position.set(lerp(q.x, tx, e), lerp(q.y, potY, e) + 3.0 * Math.sin(Math.PI * e), lerp(q.z, tz, e));
        m.rotation.set(0, e * 3 + 0, lerp(Math.PI / 2 + q.lean, 0, e));
        m.scale.set(lerp(q.sy, 0.58, e), lerp(q.thick, 1, e), lerp(q.sz, 0.5, e));
      } else placeInPot(m, i, fryK, swirlA, potY, potXZ);
    } else if (!isSlice && p >= 0.615) {
      const t0 = 0.615 + (i - NSLICES) * 0.0045, t = seg(p, t0, t0 + 0.022);
      if (t > 0) {
        vis = true;
        const [tx, tz] = potXZ(0);
        if (t < 1) {
          const yy = lerp(OIL_Y + 6.5, potY, t * t);
          m.position.set(tx + (1 - t) * 0.4, yy, tz); m.rotation.set((1 - t) * 1.2, t * 4, 0); m.scale.set(0.58, 1, 0.5);
        } else placeInPot(m, i, fryK, swirlA, potY, potXZ);
      }
    }
    // flight to the can
    if (p >= packP[0] && vis) {
      const t0 = packP[0] + i * 0.0026, t = seg(p, t0, t0 + 0.036);
      const [sx, sz] = potXZ(swirlA);
      const endX = CAN_X + (((i * 37) % 11) - 5) * 0.012, endZ = (((i * 53) % 11) - 5) * 0.012;
      const P0 = new THREE.Vector3(sx, potY, sz), P3 = new THREE.Vector3(endX, canY(i), endZ);
      const P1 = new THREE.Vector3(sx + 1.4, OIL_Y + 3.6, 0.3), P2 = new THREE.Vector3(CAN_X, CT + CAN_H + 2.6, 0.1);
      if (t > 0) {
        const e = sm(t), u = 1 - e;
        m.position.set(
          u * u * u * P0.x + 3 * u * u * e * P1.x + 3 * u * e * e * P2.x + e * e * e * P3.x,
          u * u * u * P0.y + 3 * u * u * e * P1.y + 3 * u * e * e * P2.y + e * e * e * P3.y,
          u * u * u * P0.z + 3 * u * u * e * P1.z + 3 * u * e * e * P2.z + e * e * e * P3.z);
        m.rotation.set(Math.sin(t * 6 + i) * 0.35 * (1 - e), tgt.an + t * 3, Math.cos(t * 5 + i) * 0.3 * (1 - e));
        m.scale.set(0.58, 1, 0.5);
      }
    }
    m.visible = vis;
    m.material.color.copy(PALE).lerp(GOLD, tone * (0.85 + 0.2 * d.tone)).lerp(DEEP, 0.0);
  });
  function placeInPot(m, i, fk, sw, y, xz) {
    const [x, z] = xz(sw);
    m.position.set(x, y + 0.0, z);
    const grow = 1 + 0.18 * sm(fk);
    m.rotation.set(0, potTargets[i].an + sw * 1.3, 0);
    m.scale.set(0.58 * grow, 1, 0.5 * grow);
  }

  // --- fryer ambience
  const fryOn = p > 0.6 && p < 0.84;
  const heat = sm(seg(p, 0.6, 0.66)) * (1 - sm(seg(p, 0.79, 0.84)));
  burner.material.emissiveIntensity = heat * 1.6;
  oil.material.emissiveIntensity = 0.2 + heat * 0.35;
  bubbles.forEach((b) => {
    const u = b.userData, ph = frac(p * u.sp + u.ph);
    const s = fryOn && heat > 0.05 ? (ph < 0.55 ? ph / 0.55 : Math.max(0, 1 - (ph - 0.55) / 0.2)) : 0;
    b.visible = s > 0.02; b.position.set(POT_X + u.x, OIL_Y + 0.03, u.z); b.scale.setScalar(0.4 + s * 1.1);
  });
  steam.forEach((s) => {
    const u = s.userData, ph = frac(p * u.sp + u.ph);
    s.visible = heat > 0.1; s.material.opacity = (1 - ph) * 0.16 * heat;
    s.position.set(POT_X + u.x + ph * 0.7, OIL_Y + 0.4 + ph * 3.2, u.z); s.scale.setScalar(0.5 + ph * 1.6);
  });

  // --- can
  const turn = seg(p, 0.9, 1.0);
  can.rotation.y = -0.5 + sm(turn) * (Math.PI * 2 + 0.5);
  const lt = seg(p, lidP[0], lidP[1]);
  lid.visible = lt > 0;
  const drop = lt < 0.75 ? lerp(5, 0, (lt / 0.75) ** 2) : 0.18 * Math.sin((lt - 0.75) / 0.25 * Math.PI) * 0.5;
  lid.position.set(CAN_X, CT + CAN_H + 0.1 + drop, 0); lid.rotation.y = can.rotation.y;
  const lidReady = lt >= 1;
  if (lidReady) lid.position.y = CT + CAN_H + 0.1;

  // --- camera
  smoothCam(p);
  sun.position.set(camera.position.x + 9, 16, 11);
  sun.target.position.set(camera.position.x, 0, 0);
  sun.target.updateMatrixWorld();
}

/* ------------------------------------------------------------------ */
/* captions                                                            */
/* ------------------------------------------------------------------ */
const CHAPTERS = [
  [0.012, 0.075, '01 · Le champ', 'Une récolte bien précise', 'Chaque chips commence par une pomme de terre, cultivée dans de la terre riche et bien drainée.'],
  [0.075, 0.138, '02 · La récolte', 'Arrachée, triée, lancée', 'La pomme de terre est cueillie à la main, puis part rouler vers la collecte.'],
  [0.138, 0.335, '03 · Le transport', 'Direction l\'usine', 'Un réseau de conduites achemine les pommes de terre du champ jusqu\'à la cuisine de production.'],
  [0.36, 0.40, '04 · L\'arrivée', 'Bienvenue en cuisine', 'Réception, lavage, contrôle de la calibration.'],
  [0.40, 0.52, '05 · L\'épluchage', 'La peau s\'en va', 'Les pommes de terre sont épluchées, les yeux et les défauts retirés.'],
  [0.52, 0.64, '06 · La découpe', 'Des tranches fines', 'Une lame découpe des tranches régulières, d\'à peine quelques millimètres.'],
  [0.64, 0.78, '07 · La friture', 'Dorer à la perfection', 'Dans l\'huile chaude, l\'eau s\'évapore : les tranches se courbent, dorent et deviennent croustillantes.'],
  [0.78, 0.9, '08 · L\'emballage', 'Empilées, protégées', 'Les chips sont empilées dans un tube hermétique, puis scellées pour garder tout leur croquant.'],
];
const hero = document.getElementById('hero');
const caption = document.getElementById('caption');
const capStep = document.getElementById('capStep'), capTitle = document.getElementById('capTitle'), capText = document.getElementById('capText');
const finale = document.getElementById('finale');
const railFill = document.getElementById('railFill');
let lastChap = -2;
function updateUI(p) {
  hero.style.opacity = String(1 - clamp(p / 0.02));
  const ci = CHAPTERS.findIndex((c) => p >= c[0] && p < c[1]);
  if (ci !== lastChap) {
    lastChap = ci;
    if (ci < 0) caption.classList.add('hidden');
    else { const c = CHAPTERS[ci]; capStep.textContent = c[2]; capTitle.textContent = c[3]; capText.textContent = c[4]; caption.classList.remove('hidden'); }
  }
  finale.style.opacity = p > 0.93 ? '1' : '0';
  railFill.style.height = `${p * 100}%`;
}

/* ------------------------------------------------------------------ */
/* loop / scroll / autoplay                                            */
/* ------------------------------------------------------------------ */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 58 : 38;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

const scrollP = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp(window.scrollY / max) : 0;
};
let shown = scrollP(), auto = false, autoT = 0, lastT = performance.now(), manual = null;
const playBtn = document.getElementById('play');
const AUTO_SECONDS = 75;
playBtn.addEventListener('click', () => {
  auto = !auto;
  if (auto && scrollP() > 0.985) window.scrollTo(0, 0);
  playBtn.textContent = auto ? '❚❚ Pause' : '▶ Lecture auto';
});
window.addEventListener('wheel', () => { if (auto) { auto = false; playBtn.textContent = '▶ Lecture auto'; } }, { passive: true });
window.addEventListener('touchstart', () => { if (auto) { auto = false; playBtn.textContent = '▶ Lecture auto'; } }, { passive: true });

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (auto) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const np = clamp(scrollP() + dt / AUTO_SECONDS);
    window.scrollTo(0, np * max);
    if (np >= 1) { auto = false; playBtn.textContent = '▶ Lecture auto'; }
  }
  const target = manual ?? scrollP();
  shown = manual != null ? manual : shown + (target - shown) * (1 - Math.pow(0.0015, dt));
  update(shown); updateUI(shown);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
// test hook: render a given progress immediately
window.__setP = (p) => { manual = p; update(p); updateUI(p); renderer.render(scene, camera); return p; };
window.__release = () => { manual = null; };
update(shown); updateUI(shown);
document.getElementById('loading').classList.add('done');
requestAnimationFrame(frame);
