'use strict';
/* Grafika: tła plansz, ufoludek, statki, cząsteczki i fajerwerki. */

const W = 1280, H = 720;
const FONT = "'Fredoka', 'Trebuchet MS', 'Segoe UI', sans-serif";

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** amt > 0 rozjaśnia, amt < 0 przyciemnia (−1..1) */
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = c => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Tła plansz                                                          */
/* ------------------------------------------------------------------ */

const THEMES = [
  { name: 'Orbita Ziemi', sky: ['#020617', '#0a1d52'], neb: [215, 250, 190],
    planet: { x: 1110, y: 640, r: 200, c: '#3b82f6', land: '#22c55e', atmo: '#7dd3fc' }, moon: { x: 160, y: 120, r: 34 } },
  { name: 'Pas Asteroid', sky: ['#07040f', '#26102e'], neb: [20, 330, 280],
    planet: { x: 150, y: 650, r: 140, c: '#c2410c', bands: true, atmo: '#fdba74' }, asteroids: true },
  { name: 'Fioletowa Mgławica', sky: ['#0c0220', '#3b0764'], neb: [285, 300, 260, 320],
    planet: { x: 1120, y: 140, r: 70, c: '#e879f9', ring: true, atmo: '#f5d0fe' } },
  { name: 'Czerwony Karzeł', sky: ['#120202', '#3d0b0b'], neb: [5, 25, 340],
    sun: { x: 1160, y: 110, r: 95, c: '#ff5a36' }, planet: { x: 130, y: 610, r: 90, c: '#7c2d12', atmo: '#fb923c' } },
  { name: 'Szmaragdowa Galaktyka', sky: ['#01110e', '#053a3a'], neb: [160, 175, 140, 200],
    galaxy: { x: 980, y: 230 }, planet: { x: 200, y: 640, r: 120, c: '#0d9488', ring: true, atmo: '#5eead4' } },
];

function themeFor(level) {
  const t = THEMES[(level - 1) % THEMES.length];
  const cycle = Math.floor((level - 1) / THEMES.length);
  return { ...t, title: cycle ? `${t.name} ${cycle + 1}` : t.name, hueShift: cycle * 40, seed: level * 977 };
}

function renderBackground(level) {
  const th = themeFor(level);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rnd = mulberry32(th.seed);

  if (th.hueShift) g.filter = `hue-rotate(${th.hueShift}deg)`;

  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, th.sky[0]);
  grad.addColorStop(1, th.sky[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // mgławice
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const hue = th.neb[Math.floor(rnd() * th.neb.length)] + (rnd() * 30 - 15);
    const x = rnd() * W, y = rnd() * H, r = 120 + rnd() * 320;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `hsla(${hue},80%,55%,${0.05 + rnd() * 0.08})`);
    rg.addColorStop(1, `hsla(${hue},80%,40%,0)`);
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalCompositeOperation = 'source-over';

  // drobne, nieruchome gwiazdki
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.5})`;
    const s = rnd() < 0.9 ? 1 : 2;
    g.fillRect(rnd() * W, rnd() * H, s, s);
  }

  if (th.galaxy) drawGalaxy(g, th.galaxy.x, th.galaxy.y, rnd);
  if (th.sun) drawSun(g, th.sun);
  if (th.moon) drawPlanet(g, { ...th.moon, c: '#cbd5e1', atmo: '#e2e8f0', craters: true }, rnd);
  if (th.planet) drawPlanet(g, th.planet, rnd);
  if (th.asteroids) {
    for (let i = 0; i < 14; i++) drawRock(g, rnd() * W, 80 + rnd() * (H - 260), 6 + rnd() * 18, rnd, 0.55);
  }
  return c;
}

function drawSun(g, s) {
  const glow = g.createRadialGradient(s.x, s.y, s.r * 0.3, s.x, s.y, s.r * 3);
  glow.addColorStop(0, rgba(s.c, 0.55));
  glow.addColorStop(1, rgba(s.c, 0));
  g.fillStyle = glow;
  g.fillRect(s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
  const body = g.createRadialGradient(s.x - s.r * 0.3, s.y - s.r * 0.3, 5, s.x, s.y, s.r);
  body.addColorStop(0, '#fff3c4');
  body.addColorStop(0.4, '#ffb347');
  body.addColorStop(1, s.c);
  g.fillStyle = body;
  g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill();
}

function drawPlanet(g, p, rnd) {
  // poświata atmosfery
  const glow = g.createRadialGradient(p.x, p.y, p.r * 0.9, p.x, p.y, p.r * 1.25);
  glow.addColorStop(0, rgba(p.atmo || p.c, 0.35));
  glow.addColorStop(1, rgba(p.atmo || p.c, 0));
  g.fillStyle = glow;
  g.beginPath(); g.arc(p.x, p.y, p.r * 1.25, 0, Math.PI * 2); g.fill();

  if (p.ring) drawRing(g, p, true);

  g.save();
  g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.clip();
  const body = g.createRadialGradient(p.x - p.r * 0.4, p.y - p.r * 0.4, p.r * 0.1, p.x, p.y, p.r);
  body.addColorStop(0, shade(p.c, 0.35));
  body.addColorStop(0.6, p.c);
  body.addColorStop(1, shade(p.c, -0.6));
  g.fillStyle = body;
  g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  if (p.land) {
    g.fillStyle = rgba(p.land, 0.7);
    for (let i = 0; i < 5; i++) {
      const lx = p.x + (rnd() - 0.5) * p.r * 1.4, ly = p.y + (rnd() - 0.5) * p.r * 1.4;
      for (let j = 0; j < 5; j++) {
        g.beginPath();
        g.arc(lx + (rnd() - 0.5) * p.r * 0.3, ly + (rnd() - 0.5) * p.r * 0.2, p.r * (0.05 + rnd() * 0.09), 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  if (p.bands) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.1})`;
      g.fillRect(p.x - p.r, p.y - p.r + rnd() * p.r * 2, p.r * 2, 6 + rnd() * 18);
    }
  }
  if (p.craters) {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(80,90,110,0.45)';
      g.beginPath(); g.arc(p.x + (rnd() - 0.5) * p.r * 1.3, p.y + (rnd() - 0.5) * p.r * 1.3, p.r * (0.08 + rnd() * 0.15), 0, Math.PI * 2); g.fill();
    }
  }
  // cień
  const sh = g.createRadialGradient(p.x - p.r * 0.5, p.y - p.r * 0.5, p.r * 0.6, p.x, p.y, p.r * 1.4);
  sh.addColorStop(0, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = sh;
  g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  g.restore();

  if (p.ring) drawRing(g, p, false);
}

function drawRing(g, p, back) {
  g.save();
  g.translate(p.x, p.y);
  g.rotate(-0.35);
  g.beginPath();
  if (back) g.ellipse(0, 0, p.r * 1.9, p.r * 0.45, 0, Math.PI, Math.PI * 2);
  else g.ellipse(0, 0, p.r * 1.9, p.r * 0.45, 0, 0, Math.PI);
  g.strokeStyle = rgba(p.atmo || '#ffffff', 0.55);
  g.lineWidth = p.r * 0.14;
  g.stroke();
  g.strokeStyle = rgba('#ffffff', 0.25);
  g.lineWidth = p.r * 0.04;
  g.stroke();
  g.restore();
}

function drawGalaxy(g, cx, cy, rnd) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, 90);
  core.addColorStop(0, 'rgba(255,255,220,0.6)');
  core.addColorStop(1, 'rgba(120,255,220,0)');
  g.fillStyle = core;
  g.fillRect(cx - 90, cy - 90, 180, 180);
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 260; i++) {
      const t = i / 260;
      const ang = arm * (Math.PI * 2 / 3) + t * 5.5;
      const rad = 10 + t * 210;
      const x = cx + Math.cos(ang) * rad + (rnd() - 0.5) * 22;
      const y = cy + Math.sin(ang) * rad * 0.45 + (rnd() - 0.5) * 12;
      g.fillStyle = `hsla(${150 + rnd() * 60},90%,75%,${0.5 * (1 - t)})`;
      g.fillRect(x, y, 2, 2);
    }
  }
  g.restore();
}

function drawRock(g, x, y, r, rnd, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.beginPath();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rnd() * 0.35);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  gr.addColorStop(0, '#8b7d6b');
  gr.addColorStop(1, '#2b231c');
  g.fillStyle = gr;
  g.fill();
  g.restore();
}

/* ------------------------------------------------------------------ */
/* Gwiazdy z paralaksą                                                 */
/* ------------------------------------------------------------------ */

class Starfield {
  constructor(n = 140) {
    this.stars = [];
    for (let i = 0; i < n; i++) {
      const layer = Math.random() < 0.6 ? 1 : (Math.random() < 0.7 ? 2 : 3);
      this.stars.push({ x: Math.random() * W, y: Math.random() * H, layer, tw: Math.random() * 6.28 });
    }
  }
  update(dt) {
    for (const s of this.stars) {
      s.x -= s.layer * s.layer * 6 * dt;
      s.tw += dt * 2;
      if (s.x < -4) { s.x = W + 4; s.y = Math.random() * H; }
    }
  }
  draw(ctx) {
    for (const s of this.stars) {
      const a = 0.5 + 0.5 * Math.sin(s.tw);
      ctx.fillStyle = `rgba(220,235,255,${0.3 + 0.5 * a})`;
      const size = s.layer === 3 ? 2.6 : s.layer === 2 ? 1.8 : 1.1;
      ctx.beginPath(); ctx.arc(s.x, s.y, size, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ufoludek                                                            */
/* ------------------------------------------------------------------ */

function drawUfo(ctx, x, y, scale, color, t, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  // szklana kopuła (tył)
  ctx.beginPath();
  ctx.ellipse(0, -14, 34, 34, 0, Math.PI, 0);
  ctx.fillStyle = 'rgba(140,200,255,0.18)';
  ctx.fill();

  // ufoludek
  const bob = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.translate(0, bob);
  // czułki
  ctx.strokeStyle = shade(color, -0.2);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-8, -36); ctx.quadraticCurveTo(-14, -48, -17, -50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -36); ctx.quadraticCurveTo(14, -48, 17, -50); ctx.stroke();
  const glowA = 0.6 + 0.4 * Math.sin(t * 6);
  ctx.fillStyle = `rgba(255,255,170,${glowA})`;
  ctx.beginPath(); ctx.arc(-17, -50, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -50, 4, 0, Math.PI * 2); ctx.fill();
  // głowa
  const hg = ctx.createRadialGradient(-6, -32, 3, 0, -24, 22);
  hg.addColorStop(0, shade(color, 0.45));
  hg.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.ellipse(0, -24, 19, 17, 0, 0, Math.PI * 2); ctx.fill();
  // oczy
  const blink = (Math.sin(t * 1.3) > 0.985) ? 0.15 : 1;
  ctx.fillStyle = '#0b0b1a';
  ctx.beginPath(); ctx.ellipse(-7, -25, 5.5, 7 * blink, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, -25, 5.5, 7 * blink, 0.3, 0, Math.PI * 2); ctx.fill();
  if (blink === 1) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5.5, -28, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8.5, -28, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  // uśmiech
  ctx.strokeStyle = '#0b0b1a';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, -17, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();

  // kopuła (przód – odblask)
  ctx.beginPath();
  ctx.ellipse(0, -14, 34, 34, 0, Math.PI, 0);
  ctx.strokeStyle = 'rgba(200,235,255,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-14, -32, 7, 12, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();

  // spodek
  const sg = ctx.createLinearGradient(0, -20, 0, 14);
  sg.addColorStop(0, '#e6ecf5');
  sg.addColorStop(0.5, '#8f9bb0');
  sg.addColorStop(1, '#3b4456');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.ellipse(0, -6, 62, 18, 0, 0, Math.PI * 2); ctx.fill();
  // pas w kolorze gracza
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, -2, 58, 9, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = shade(color, -0.4);
  ctx.beginPath(); ctx.ellipse(0, 6, 26, 7, 0, 0, Math.PI); ctx.fill();
  // światełka
  for (let i = 0; i < 7; i++) {
    const lx = -45 + i * 15;
    const on = Math.sin(t * 8 - i) > 0;
    ctx.fillStyle = on ? '#fffbd0' : shade(color, 0.2);
    ctx.beginPath(); ctx.arc(lx, 0 + Math.abs(lx) * 0.06, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Statki                                                              */
/* ------------------------------------------------------------------ */

const SHIP_H = 56;
const SHIP_COLORS = ['#6d5dfc', '#e2557b', '#f08a24', '#1fb6a6', '#3f8efc', '#b04ce0', '#d9a514', '#4caf50'];
/* Wygląd statku: zwykły (komputer) i powiększony (telefon/tablet) –
 * k to skala całego statku, fs to rozmiar liczb w panelu (przed skalowaniem). */
const SHIP_STYLE_NORMAL = { k: 1, fs: 28, panel: 38 };
const SHIP_STYLE_BIG = { k: 1.3, fs: 38, panel: 48 };
const shipFont = st => `700 ${st.fs}px ${FONT}`;

function shipLength(ctx, text, st = SHIP_STYLE_NORMAL) {
  ctx.font = shipFont(st);
  const tw = ctx.measureText(text).width;
  return Math.ceil((tw + 46 + SHIP_H * 0.8) * st.k);
}

function drawShip(ctx, s, t) {
  const st = s.style || SHIP_STYLE_NORMAL;
  // ostrzeżenie – statek blisko prawej krawędzi (w prawdziwych współrzędnych)
  const warn = s.x + s.w > W - 140;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(st.k, st.k);
  drawShipBody(ctx, s, t, st, warn);
  ctx.restore();
}

function drawShipBody(ctx, s, t, st, warn) {
  const x = 0, y = 0, w = s.w / st.k, h = SHIP_H;
  const top = y - h / 2, bot = y + h / 2;
  const noseStart = x + w - h * 0.6;

  // płomień silnika
  const fl = 22 + Math.sin(t * 40 + s.seed) * 6 + Math.random() * 6;
  const fg = ctx.createLinearGradient(x - fl, 0, x + 6, 0);
  fg.addColorStop(0, 'rgba(255,80,0,0)');
  fg.addColorStop(0.5, 'rgba(255,150,30,0.9)');
  fg.addColorStop(1, 'rgba(255,255,200,1)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 13);
  ctx.quadraticCurveTo(x - fl * 0.6, y - 8, x - fl, y);
  ctx.quadraticCurveTo(x - fl * 0.6, y + 8, x + 4, y + 13);
  ctx.closePath();
  ctx.fill();

  // statecznik górny i dolny
  ctx.fillStyle = shade(s.color, -0.35);
  ctx.beginPath();
  ctx.moveTo(x + 8, top + 4); ctx.lineTo(x + 46, top + 4); ctx.lineTo(x + 6, top - 16); ctx.lineTo(x - 4, top - 16);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 8, bot - 4); ctx.lineTo(x + 46, bot - 4); ctx.lineTo(x + 6, bot + 16); ctx.lineTo(x - 4, bot + 16);
  ctx.closePath(); ctx.fill();

  // kadłub
  ctx.beginPath();
  ctx.moveTo(x + 12, top);
  ctx.lineTo(noseStart, top);
  ctx.quadraticCurveTo(x + w + 4, top + 4, x + w + 16, y);
  ctx.quadraticCurveTo(x + w + 4, bot - 4, noseStart, bot);
  ctx.lineTo(x + 12, bot);
  ctx.quadraticCurveTo(x, bot, x, bot - 12);
  ctx.lineTo(x, top + 12);
  ctx.quadraticCurveTo(x, top, x + 12, top);
  ctx.closePath();
  const bg = ctx.createLinearGradient(0, top, 0, bot);
  bg.addColorStop(0, shade(s.color, 0.45));
  bg.addColorStop(0.45, s.color);
  bg.addColorStop(1, shade(s.color, -0.5));
  ctx.fillStyle = bg;
  ctx.fill();

  if (warn) {
    ctx.save();
    ctx.shadowColor = '#ff2a2a';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(255,60,60,${0.6 + 0.4 * Math.sin(t * 14)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // okienko kokpitu
  ctx.fillStyle = '#9ff3ff';
  ctx.beginPath(); ctx.ellipse(x + w - h * 0.25, y - 7, 10, 7, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.ellipse(x + w - h * 0.25 - 3, y - 9, 3, 2, 0.2, 0, Math.PI * 2); ctx.fill();

  // panel z działaniem
  const px = x + 14, pw = w - h * 0.75 - 14;
  roundRect(ctx, px, y - st.panel / 2, pw, st.panel, 10);
  ctx.fillStyle = 'rgba(5,10,30,0.55)';
  ctx.fill();
  ctx.font = shipFont(st);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(s.problem.text, px + pw / 2, y + 1);
}

/* ------------------------------------------------------------------ */
/* Cząsteczki, wybuchy, fajerwerki                                     */
/* ------------------------------------------------------------------ */

class Particles {
  constructor() { this.list = []; this.rings = []; }

  explosion(x, y, color) {
    const colors = ['#fff6c2', '#ffcf4a', '#ff7b2e', color];
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 320;
      this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + Math.random() * 0.7,
        max: 1.2, size: 2 + Math.random() * 4, color: colors[i % colors.length], drag: 2.2, g: 0 });
    }
    // odłamki kadłuba
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 200;
      this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 + Math.random() * 0.6,
        max: 1.4, size: 5 + Math.random() * 5, color, drag: 1.2, g: 120, square: true, rot: Math.random() * 6 });
    }
    this.rings.push({ x, y, r: 10, life: 0.45, max: 0.45, color: '#fff2b0' });
  }

  burst(x, y, hue) {
    // fajerwerk
    const n = 90 + Math.floor(Math.random() * 40);
    const type = Math.random();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.05;
      let sp = 120 + Math.random() * 200;
      if (type < 0.3) sp = 220; // równy okrąg
      const h = type > 0.7 ? hue + (i % 2) * 120 : hue + Math.random() * 30;
      this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2 + Math.random() * 0.9,
        max: 2.1, size: 2 + Math.random() * 1.5, color: `hsl(${h},100%,65%)`, drag: 1.4, g: 90, sparkle: true });
    }
    this.rings.push({ x, y, r: 6, life: 0.3, max: 0.3, color: `hsl(${hue},100%,85%)` });
  }

  update(dt) {
    for (const p of this.list) {
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.vy += p.g * dt;
      p.px = p.x; p.py = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.rot !== undefined) p.rot += dt * 8;
    }
    this.list = this.list.filter(p => p.life > 0);
    for (const r of this.rings) { r.r += 380 * dt; r.life -= dt; }
    this.rings = this.rings.filter(r => r.life > 0);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.rings) {
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.life / r.max);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of this.list) {
      let a = Math.min(1, p.life / (p.max * 0.5));
      if (p.sparkle && p.life < 0.6) a *= Math.random() < 0.5 ? 0.3 : 1;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.square) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}

class Fireworks {
  constructor(particles) { this.p = particles; this.rockets = []; this.timer = 0; this.active = false; }
  start() { this.active = true; this.timer = 0; }
  stop() { this.active = false; }
  launch() {
    this.rockets.push({ x: 150 + Math.random() * (W - 300), y: H + 10, vx: (Math.random() - 0.5) * 80,
      vy: -(520 + Math.random() * 200), hue: Math.floor(Math.random() * 360), trail: [] });
    Sound.whistle();
  }
  update(dt) {
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) { this.launch(); this.timer = 0.25 + Math.random() * 0.35; }
    }
    for (const r of this.rockets) {
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 10) r.trail.shift();
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 260 * dt;
      if (r.vy > -60) { r.done = true; this.p.burst(r.x, r.y, r.hue); Sound.pop(); }
    }
    this.rockets = this.rockets.filter(r => !r.done);
  }
  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.rockets) {
      r.trail.forEach((p, i) => {
        ctx.globalAlpha = i / r.trail.length;
        ctx.fillStyle = `hsl(${r.hue},100%,75%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.restore();
  }
}
