/*
 * 3D-примерочная: процедурная модель одежды на портновском манекене.
 * Вращение 360° мышью / пальцем, автоповорот, смена цвета и фактуры ткани.
 * Если у товара указан product.model (.glb) — грузится реальная модель
 * (экспорт из CLO3D / Marvelous Designer / Blender).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DEPTH = 0.74; // сечение фигуры — овал, а не круг
const BASE_Y = -0.95;

/* ---------- Профили (радиус, высота) ---------- */
const P = {
  form: [[0, .88], [.40, .88], [.44, .95], [.45, 1.05], [.40, 1.25], [.34, 1.35], [.36, 1.45], [.42, 1.58], [.44, 1.66], [.41, 1.76], [.36, 1.86], [.24, 1.95], [.13, 2.0], [.115, 2.1], [0, 2.1]],
  top: [[.37, 1.36], [.385, 1.45], [.445, 1.58], [.465, 1.66], [.435, 1.76], [.39, 1.86], [.27, 1.95], [.155, 2.0]],
  topOpen: [[.37, 1.36], [.385, 1.45], [.445, 1.58], [.465, 1.66], [.435, 1.76], [.40, 1.84]],
  dress: [[.64, .05], [.585, .3], [.525, .6], [.478, .9], [.47, 1.05], [.42, 1.25]],
  silkDress: [[.74, -.02], [.64, .3], [.55, .6], [.49, .9], [.47, 1.05], [.42, 1.25]],
  jacket: [[.5, .78], [.49, .9], [.475, 1.05], [.415, 1.25]],
  jacketShort: [[.48, .95], [.475, 1.05], [.415, 1.25]],
  blouse: [[.53, .86], [.5, .95], [.48, 1.05], [.44, 1.25]],
  coat: [[.61, -.15], [.575, .2], [.535, .6], [.505, .9], [.495, 1.05], [.455, 1.25]],
  skirt: [[.5, .2], [.49, .5], [.478, .8], [.476, .98], [.42, 1.2], [.365, 1.32], [.35, 1.36]],
  skirtStraight: [[.53, .25], [.51, .5], [.49, .8], [.478, .98], [.42, 1.2], [.365, 1.32], [.35, 1.36]],
  hips: [[.34, .72], [.43, .8], [.47, .9], [.478, .98], [.42, 1.2], [.375, 1.32], [.37, 1.36]]
};

function radiusAt(pts, y) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [r0, y0] = pts[i], [r1, y1] = pts[i + 1];
    if ((y >= y0 && y <= y1) || (y <= y0 && y >= y1)) {
      const t = (y - y0) / ((y1 - y0) || 1);
      return r0 + (r1 - r0) * t;
    }
  }
  return pts[pts.length - 1][0];
}

function lathe(pts, scale = 1, segs = 96) {
  const v = pts.map(([r, y]) => new THREE.Vector2(r * scale, y));
  const g = new THREE.LatheGeometry(v, segs);
  g.scale(1, 1, DEPTH);
  return g;
}

/* Складки/драпировка: волна по окружности, растущая к подолу */
function addFolds(geo, count, amp, yTop, yBottom) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y > yTop) continue;
    const k = Math.min(1, (yTop - v.y) / (yTop - yBottom));
    const a = Math.atan2(v.z / DEPTH, v.x);
    const f = 1 + amp * k * k * (Math.sin(a * count) * .7 + Math.sin(a * count * 2.3 + 1.7) * .3);
    pos.setXYZ(i, v.x * f, v.y, v.z * f);
  }
  geo.computeVertexNormals();
}

/* ---------- Процедурные фактуры тканей ---------- */
const texCache = new Map();
function canvasTex(key, draw, repeat = [8, 8]) {
  const id = key + repeat.join('x');
  if (texCache.has(id)) return texCache.get(id);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  draw(ctx, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  texCache.set(id, t);
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

const fabricDraw = {
  wool(ctx, s) {
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, s, s);
    for (let i = -s; i < s * 2; i += 3) { // саржа
      ctx.strokeStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '120,120,120'},${rnd(.15, .35)})`;
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
    }
  },
  tweed(ctx, s) {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const l = Math.random() < .5 ? rnd(160, 255) : rnd(60, 130);
      ctx.fillStyle = `rgba(${l},${l},${l},${rnd(.4, .9)})`;
      const x = rnd(0, s), y = rnd(0, s), w = rnd(2, 7);
      Math.random() < .5 ? ctx.fillRect(x, y, w, 2) : ctx.fillRect(x, y, 2, w);
    }
  },
  silk(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, '#f2f2f2'); g.addColorStop(.5, '#ffffff'); g.addColorStop(1, '#f2f2f2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  },
  felt(ctx, s) {
    ctx.fillStyle = '#ececec'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const l = rnd(190, 255);
      ctx.fillStyle = `rgba(${l},${l},${l},.35)`;
      ctx.fillRect(rnd(0, s), rnd(0, s), 1.5, 1.5);
    }
  },
  suede(ctx, s) { fabricDraw.felt(ctx, s); },
  stripe(ctx, s) { // вертикальная полоска: светлая по основному цвету
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#2a2a2a';
    for (let x = 0; x < s; x += 32) ctx.fillRect(x, 0, 14, s);
  },
  geo(ctx, s) { // геометрический принт: ромбы и точки
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#e8d9b0';
    const st = s / 4;
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
      const x = i * st, y = j * st;
      ctx.beginPath(); ctx.moveTo(x, y - st * .32); ctx.lineTo(x + st * .32, y); ctx.lineTo(x, y + st * .32); ctx.lineTo(x - st * .32, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(x + st / 2, y + st / 2, st * .08, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e8d9b0';
    }
  },
  crepe(ctx, s) {
    ctx.fillStyle = '#e6e6e6'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 14000; i++) {
      const l = Math.random() < .5 ? 255 : 150;
      ctx.fillStyle = `rgba(${l},${l},${l},.25)`;
      ctx.fillRect(rnd(0, s), rnd(0, s), 1, 1);
    }
  },
  lace(ctx, s) { // alpha-карта кружева: белое — ткань, чёрное — просвет
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, s, s);
    const n = 4, step = s / n;
    for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) {
      const x = i * step + (j % 2 ? step / 2 : 0), y = j * step;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(x, y, step * .2, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 8; k++) { // лепестки-просветы вокруг цветка
        const a = k * Math.PI / 4;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * step * .33, y + Math.sin(a) * step * .33, step * .07, step * .035, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, step * .07, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; // сетка между мотивами
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + step / 2, y + step * (k - 1) / 3, step * .045, 0, Math.PI * 2); ctx.fill(); }
    }
  }
};

function fabricMaterial(fabric, hex) {
  const f = fabricDraw[fabric] ? fabric : 'wool';
  const rep = f === 'lace' ? [8, 6] : f === 'tweed' ? [6, 6] : f === 'stripe' ? [10, 1] : f === 'geo' ? [5, 4] : [14, 12];
  const tex = canvasTex(f, fabricDraw[f], rep);
  tex.colorSpace = THREE.SRGBColorSpace;
  const base = {
    color: new THREE.Color(hex), side: THREE.DoubleSide,
    roughness: .85, metalness: 0, sheen: .6, sheenRoughness: .8,
    sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), .35)
  };
  const byFabric = {
    wool: { map: tex, bumpMap: tex, bumpScale: .7 },
    tweed: { map: tex, bumpMap: tex, bumpScale: 4, roughness: .95, sheen: .3 },
    silk: { roughness: .32, sheen: 1, sheenRoughness: .25, clearcoat: .15, clearcoatRoughness: .5 },
    felt: { map: tex, bumpMap: tex, bumpScale: .8, roughness: 1, sheen: .4 },
    suede: { map: tex, bumpMap: tex, bumpScale: .6, roughness: .9, sheen: 1, sheenRoughness: .95 },
    crepe: { map: tex, bumpMap: tex, bumpScale: .9, roughness: .8 },
    stripe: { map: tex, roughness: .6, sheen: .5 },
    geo: { map: tex, roughness: .5, sheen: .7, sheenRoughness: .4 },
    lace: { alphaMap: tex, alphaTest: .5, roughness: .7, sheen: .8 }
  };
  return new THREE.MeshPhysicalMaterial({ ...base, ...byFabric[f] });
}

/* ---------- Сборка одежды ---------- */
function surfaceZ(profile, y, x = 0, lift = .012) {
  const r = radiusAt(profile, y);
  return DEPTH * Math.sqrt(Math.max(r * r - x * x, 0)) + lift;
}

function frontCurve(profile, x, yFrom, yTo, lift) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const y = yFrom + (yTo - yFrom) * i / 24;
    pts.push(new THREE.Vector3(x, y, surfaceZ(profile, y, x, lift)));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function buildGarment(product, hex, mats) {
  const g = new THREE.Group();
  const type = product.type;
  const fabric = product.fabric || 'wool';
  const main = fabricMaterial(fabric, hex);
  mats.main = main;
  const add = (geo, mat = main) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).multiplyScalar(.45), roughness: .6 });
  const metal = new THREE.MeshStandardMaterial({ color: '#c9a86a', metalness: 1, roughness: .28 });
  const horn = new THREE.MeshPhysicalMaterial({ color: '#1b1714', roughness: .25, clearcoat: 1 });
  mats.extra = [dark, metal, horn];

  const tweed = fabric === 'tweed';
  const hasTop = ['dress', 'jacket', 'coat', 'suit', 'blouse', 'sundress'].includes(type);
  let lower, topScale = 1.03, sleeve = null, collar = false, lapels = false, buttons = [], trim = null;

  switch (type) {
    case 'dress':
      lower = fabric === 'silk' ? P.silkDress : P.dress;
      sleeve = { len: fabric === 'silk' ? .42 : .7, r: .125 };
      collar = !!product.buttons;
      if (product.buttons) buttons = [[-.085, 1.52], [.085, 1.52], [-.085, 1.34], [.085, 1.34], [-.085, 1.16], [.085, 1.16]];
      break;
    case 'sundress':
      lower = P.dress;
      break;
    case 'jacket':
      lower = P.jacket; sleeve = { len: .92, r: .135 }; lapels = fabric !== 'lace'; collar = true;
      if (product.buttons) buttons = [[.03, 1.42], [.03, 1.22], [.03, 1.02]];
      break;
    case 'suit':
      lower = tweed ? P.jacketShort : P.jacket; sleeve = { len: tweed ? .78 : .92, r: .135 };
      lapels = !tweed; collar = !tweed;
      buttons = tweed ? [[.07, 1.5], [.07, 1.3], [.07, 1.1], [-.07, 1.5], [-.07, 1.3], [-.07, 1.1]] : [[.03, 1.3]];
      if (tweed) trim = '#f1ece2';
      break;
    case 'coat':
      lower = P.coat; topScale = 1.07; sleeve = { len: .98, r: .155 }; lapels = true; collar = true;
      if (product.buttons) buttons = [[-.11, 1.45], [.11, 1.45], [-.11, 1.15], [.11, 1.15], [-.11, .85], [.11, .85]];
      break;
    case 'blouse':
      lower = P.blouse; topScale = 1.045; sleeve = { len: .34, r: .145 };
      break;
  }

  if (hasTop) {
    const profile = [...lower, ...(type === 'sundress' ? P.topOpen : P.top)]
      .map(([r, y], i, arr) => [r * (y > 1.3 ? topScale : topScale * .985), y]);
    const geo = lathe(profile);
    if (type === 'dress' || type === 'coat') addFolds(geo, fabric === 'silk' ? 9 : 7, fabric === 'silk' ? .07 : .035, .9, lower[0][1]);
    add(geo);
    // кромка подола
    const hemR = profile[0][0];
    const hem = new THREE.TorusGeometry(hemR, .012, 8, 96); hem.rotateX(Math.PI / 2); hem.scale(1, 1, DEPTH); hem.translate(0, profile[0][1], 0);
    if (!(type === 'dress' || type === 'coat')) add(hem, trim ? new THREE.MeshStandardMaterial({ color: trim, roughness: .8 }) : main);

    // линия борта (разрез) для жакетов/пальто
    if (['jacket', 'coat', 'suit'].includes(type)) {
      const edge = new THREE.TubeGeometry(frontCurve(profile, 0, profile[0][1] + .01, 1.6, .006), 40, .005, 6);
      add(edge, dark);
      if (trim) {
        const tm = new THREE.MeshStandardMaterial({ color: trim, roughness: .85 });
        add(new THREE.TubeGeometry(frontCurve(profile, 0, profile[0][1] + .01, 1.9, .012), 40, .016, 6), tm);
        const hemTrim = new THREE.TorusGeometry(hemR + .004, .016, 8, 96); hemTrim.rotateX(Math.PI / 2); hemTrim.scale(1, 1, DEPTH); hemTrim.translate(0, profile[0][1] + .02, 0);
        add(hemTrim, tm);
      }
    }
    if (product.zip) {
      add(new THREE.TubeGeometry(frontCurve(profile, 0, profile[0][1] + .02, 1.82, .008), 60, .009, 6), metal);
      const pull = new THREE.BoxGeometry(.03, .07, .012); const pm = add(pull, metal);
      pm.position.set(0, 1.78, surfaceZ(profile, 1.78) + .01);
    }
    // бретели сарафана
    if (type === 'sundress') {
      [-1, 1].forEach(s => {
        const x = s * .2, zf = surfaceZ(profile, 1.83, x, .004);
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 1.83, zf), new THREE.Vector3(x * 1.05, 1.95, zf * .55),
          new THREE.Vector3(x * 1.08, 1.99, 0), new THREE.Vector3(x * 1.05, 1.95, -zf * .55), new THREE.Vector3(x, 1.83, -zf)]);
        const strap = new THREE.TubeGeometry(curve, 30, .03, 8);
        add(strap);
      });
    }
    // пуговицы
    buttons.forEach(([x, y]) => {
      const b = new THREE.CylinderGeometry(.028, .028, .014, 20); b.rotateX(Math.PI / 2);
      const m = add(b, product.fabric === 'tweed' ? metal : horn);
      const z = surfaceZ(profile, y, x, .008);
      m.position.set(x, y, z);
      m.lookAt(x * 3, y, z + 1);
    });
    // пояс
    if (product.belt) {
      const y = 1.3, r = radiusAt(profile, y) + .018;
      const belt = new THREE.TorusGeometry(r, .03, 10, 96); belt.rotateX(Math.PI / 2); belt.scale(1, 1.6, DEPTH); belt.translate(0, y, 0);
      add(belt);
      [-1, 1].forEach(s => {
        const end = new THREE.BoxGeometry(.06, .42, .02);
        const m = add(end); m.position.set(.06 * s + .08, y - .2, surfaceZ(profile, y - .2, .08) + .025); m.rotation.z = s * .12;
      });
    }
    // воротник
    if (collar) {
      const c = new THREE.TorusGeometry(.175 * topScale, .04, 12, 64, Math.PI * 1.55);
      c.rotateX(Math.PI / 2); c.rotateY(-Math.PI * .225 - Math.PI / 2); c.scale(1.05, 1, DEPTH * 1.15); c.translate(0, 1.965, -.005);
      add(c);
    }
    if (lapels) {
      [-1, 1].forEach(s => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0); shape.lineTo(.05 * s, .32); shape.lineTo(.13 * s, .36); shape.lineTo(.1 * s, .28); shape.lineTo(.015 * s, -.02);
        const geo = new THREE.ExtrudeGeometry(shape, { depth: .012, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2 });
        const m = add(geo);
        const y0 = type === 'coat' ? 1.52 : 1.48;
        m.position.set(.01 * s, y0, surfaceZ(P.top, y0 + .15, .06) * topScale + .004);
        m.rotation.x = -.32; m.scale.setScalar(1.35);
      });
    }
    // рукава
    if (sleeve) {
      [-1, 1].forEach(s => {
        const sg = new THREE.Group();
        const L = sleeve.len;
        const cyl = new THREE.CylinderGeometry(sleeve.r, sleeve.r * (L > .6 ? .78 : 1.05), L, 32, 6, true);
        cyl.translate(0, -L / 2, 0);
        if (L < .5) addFolds(cyl, 5, .05, 0, -L);
        const m = new THREE.Mesh(cyl, main); m.castShadow = true;
        const cap = new THREE.SphereGeometry(sleeve.r * 1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cm = new THREE.Mesh(cap, main); cm.castShadow = true; cm.scale.set(.95, .55, .95);
        sg.add(m, cm);
        if (L > .6) { // манжета
          const cuff = new THREE.TorusGeometry(sleeve.r * .78, .01, 8, 32); cuff.rotateX(Math.PI / 2); cuff.translate(0, -L, 0);
          sg.add(new THREE.Mesh(cuff, trim ? new THREE.MeshStandardMaterial({ color: trim }) : dark));
        }
        sg.position.set(s * .425 * topScale, 1.83, -.01);
        sg.rotation.z = s * .17;
        sg.rotation.x = .05;
        g.add(sg);
      });
    }
  }

  // Юбка — отдельно или в составе костюма
  if (type === 'skirt' || type === 'suit') {
    const prof = tweed ? P.skirtStraight : P.skirt;
    const geo = lathe(prof, type === 'suit' ? .995 : 1.035);
    add(geo);
    const wb = new THREE.TorusGeometry(.37, .022, 8, 96); wb.rotateX(Math.PI / 2); wb.scale(1, 1.4, DEPTH); wb.translate(0, 1.345, 0);
    if (type === 'skirt') add(wb);
    if (tweed) { // бахрома
      const fr = new THREE.CylinderGeometry(prof[0][0] + .004, prof[0][0] + .012, .05, 96, 1, true); fr.scale(1, 1, DEPTH); fr.translate(0, prof[0][1] - .02, 0);
      add(fr, fabricMaterial('tweed', new THREE.Color(hex).lerp(new THREE.Color('#fff'), .25).getHex()));
    }
  }

  if (type === 'trousers') {
    add(lathe(P.hips));
    const wb = new THREE.TorusGeometry(.378, .024, 8, 96); wb.rotateX(Math.PI / 2); wb.scale(1, 1.4, DEPTH); wb.translate(0, 1.345, 0); add(wb);
    [-1, 1].forEach(s => {
      const L = 1.72;
      const leg = new THREE.CylinderGeometry(.255, .2, L, 40, 8, true);
      leg.scale(1, 1, .92); leg.translate(s * .215, .95 - L / 2, 0);
      add(leg);
      const crease = new THREE.BoxGeometry(.006, L - .1, .006); crease.translate(s * .215, .9 - L / 2, .222);
      add(crease, dark);
    });
  }

  return g;
}

function buildForm(mats) {
  const g = new THREE.Group();
  const linen = fabricMaterial('felt', '#d8c8ae');
  linen.side = THREE.FrontSide;
  const wood = new THREE.MeshPhysicalMaterial({ color: '#3a2618', roughness: .35, clearcoat: .8 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b8955a', metalness: 1, roughness: .3 });
  mats.form = [linen, wood, brass];
  const body = new THREE.Mesh(lathe(P.form), linen); body.castShadow = body.receiveShadow = true; g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .04, 32), wood); cap.position.y = 2.12; g.add(cap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), brass); knob.position.y = 2.16; g.add(knob);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .88 - BASE_Y, 16), brass); pole.position.y = (.88 + BASE_Y) / 2; pole.castShadow = true; g.add(pole);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .08, 16), brass); collar.position.y = .1; g.add(collar);
  for (let i = 0; i < 3; i++) { // тренога
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.02, .016, .56, 10), wood);
    const a = i * Math.PI * 2 / 3 + Math.PI / 6;
    leg.position.set(Math.cos(a) * .24, BASE_Y + .07, Math.sin(a) * .24);
    leg.rotation.set(0, -a, 0); leg.rotateZ(Math.PI / 2 - .22);
    leg.castShadow = true; g.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .08, 20), wood); hub.position.y = BASE_Y + .13; g.add(hub);
  return g;
}

function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}

/* ---------- Публичный API ---------- */
export function createGarmentViewer(container, opts = {}) {
  const { autoRotate = true, interactive = true, hero = false } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  const camera = new THREE.PerspectiveCamera(hero ? 26 : 28, 1, .1, 100);
  const target = new THREE.Vector3(0, .62, 0);
  camera.position.set(0, 1.25, hero ? 7.6 : 7.2);

  scene.add(new THREE.HemisphereLight('#fff6ea', '#3a3530', .55));
  const key = new THREE.DirectionalLight('#fff3e6', 2.4);
  key.position.set(3, 5, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3, bottom: -2, near: 1, far: 15 });
  key.shadow.bias = -.0005; key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9b3', 1.6); rim.position.set(-4, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight('#cfd8ff', .4); fill.position.set(-3, 1, 3); scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: .14 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = BASE_Y - .01; ground.receiveShadow = true;
  scene.add(ground);

  const root = new THREE.Group(); scene.add(root);
  const figure = new THREE.Group(); figure.scale.set(.84, 1, .9); root.add(figure); // стройнее пропорции
  const mats = {};
  const form = buildForm(mats); figure.add(form);
  let garment = null;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true; controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.enableZoom = interactive && !hero;
  controls.enableRotate = interactive;
  controls.minDistance = 3.6; controls.maxDistance = 9;
  controls.minPolarAngle = Math.PI * .28; controls.maxPolarAngle = Math.PI * .6;
  controls.autoRotate = autoRotate; controls.autoRotateSpeed = hero ? 1.1 : 1.8;
  controls.rotateSpeed = .8;
  let resumeTimer;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); container.classList.add('is-dragging'); });
  controls.addEventListener('end', () => {
    container.classList.remove('is-dragging');
    if (state.autoRotate) resumeTimer = setTimeout(() => (controls.autoRotate = true), 3500);
  });
  controls.update();

  const state = { autoRotate, colorFrom: null, colorTo: null, colorT: 1, pop: 1, mouseX: 0, mouseY: 0 };

  if (hero) {
    window.addEventListener('pointermove', onMouse, { passive: true });
  }
  function onMouse(e) {
    state.mouseX = (e.clientX / window.innerWidth - .5);
    state.mouseY = (e.clientY / window.innerHeight - .5);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // на узких экранах отодвигаем камеру, чтобы фигура помещалась
    camera.zoom = Math.min(1, (w / h) / .62);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0 });
  io.observe(container);

  let raf = 0, last = performance.now();
  function loop() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(t => {
      const dt = Math.min((t - last) / 1000, .05); last = t;
      if (state.colorT < 1 && mats.main) {
        state.colorT = Math.min(1, state.colorT + dt * 3);
        const e = 1 - Math.pow(1 - state.colorT, 3);
        mats.main.color.copy(state.colorFrom).lerp(state.colorTo, e);
        mats.main.sheenColor.copy(mats.main.color).lerp(new THREE.Color('#fff'), .35);
      }
      if (state.pop < 1) {
        state.pop = Math.min(1, state.pop + dt * 2.2);
        const e = 1 - Math.pow(1 - state.pop, 4);
        if (garment) { garment.scale.setScalar(.9 + .1 * e); garment.position.y = (1 - e) * .25; }
        root.rotation.y = (1 - e) * -Math.PI * .6;
      }
      if (hero) {
        root.rotation.x += ((state.mouseY * .08) - root.rotation.x) * .05;
        root.position.x += ((state.mouseX * .25) - root.position.x) * .05;
      }
      controls.update();
      renderer.render(scene, camera);
      if (visible) loop();
    });
  }
  loop();

  const loader = new GLTFLoader();

  function setProduct(product, hex) {
    if (garment) { garment.parent?.remove(garment); disposeTree(garment); garment = null; }
    const color = hex || product.colors?.[0]?.hex || '#333';
    if (product.model) {
      form.visible = false;
      loader.load(product.model, gltf => {
        garment = gltf.scene;
        const box = new THREE.Box3().setFromObject(garment);
        const size = box.getSize(new THREE.Vector3());
        const s = 3 / size.y;
        garment.scale.setScalar(s);
        const c = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
        garment.position.set(-c.x, BASE_Y - box.min.y * s, -c.z);
        garment.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (!mats.main) mats.main = o.material; } });
        root.add(garment);
      });
      return;
    }
    form.visible = true;
    garment = buildGarment(product, color, mats);
    figure.add(garment);
    state.pop = 0;
  }

  function setColor(hex) {
    if (!mats.main || !mats.main.color) return;
    state.colorFrom = mats.main.color.clone();
    state.colorTo = new THREE.Color(hex);
    state.colorT = 0;
  }

  function setAutoRotate(on) { state.autoRotate = on; controls.autoRotate = on; }

  function resetView() {
    camera.position.set(0, 1.25, hero ? 7.6 : 7.2);
    controls.target.copy(target);
    controls.update();
  }

  function dispose() {
    cancelAnimationFrame(raf); clearTimeout(resumeTimer);
    ro.disconnect(); io.disconnect(); controls.dispose();
    window.removeEventListener('pointermove', onMouse);
    disposeTree(scene); pmrem.dispose(); renderer.dispose();
    renderer.domElement.remove();
  }

  return { setProduct, setColor, setAutoRotate, resetView, dispose };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
