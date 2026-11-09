'use strict';
/* Główna logika gry MathSpace. */

const POINTS_PER_LEVEL = 10;
const LEVELS_TO_WIN = 5;
const LANE_TOP = 105, LANE_GAP = 70, LANE_COUNT = 7; // pasy, po których lecą statki
const UFO_Y = H - 118;

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const stage = $('stage');

const starfield = new Starfield();
const particles = new Particles();
const fireworks = new Fireworks(particles);

const game = {
  state: 'menu',          // menu | settings | playing | paused | levelup | victory | summary
  playerId: null,
  profile: null,
  settings: null,
  level: 1,
  score: 0,
  stats: null,
  ships: [],
  lasers: [],
  texts: [],
  spawnTimer: 0,
  input: '',
  inputShake: 0,
  inputFlash: 0,
  ufo: { x: W / 2, targetX: W / 2, tilt: 0 },
  keys: {},
  bg: null,
  bgLevel: 0,
  levelTimer: 0,
  victoryShown: false,
  time: 0,
  edgeFlash: 0,
};

/* ------------------------------------------------------------------ */
/* Skalowanie sceny                                                     */
/* ------------------------------------------------------------------ */

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  // scena 1280x720 wyśrodkowana i przeskalowana do rozmiaru okna
  stage.style.left = '0';
  stage.style.top = '0';
  stage.style.transform = `translate(${(window.innerWidth - W * s) / 2}px, ${(window.innerHeight - H * s) / 2}px) scale(${s})`;
  const res = Math.min(2.5, s * (window.devicePixelRatio || 1));
  canvas.width = Math.round(W * res);
  canvas.height = Math.round(H * res);
  ctx.setTransform(res, 0, 0, res, 0, 0);
}
window.addEventListener('resize', resize);

/* ------------------------------------------------------------------ */
/* Ekrany                                                               */
/* ------------------------------------------------------------------ */

const SCREENS = ['screen-menu', 'screen-settings', 'screen-pause', 'screen-victory', 'screen-summary'];
function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  $('ingame-buttons').classList.toggle('hidden', !['playing', 'levelup', 'paused'].includes(game.state));
}

function playerDef(id) { return PLAYERS.find(p => p.id === id); }

function buildMenu() {
  const wrap = $('player-cards');
  wrap.innerHTML = '';
  for (const def of PLAYERS) {
    const prof = Store.profile(def.id);
    const card = document.createElement('div');
    card.className = 'player-card';
    card.tabIndex = 0;
    card.style.setProperty('--card-color', def.color);

    const cv = document.createElement('canvas');
    cv.width = 360; cv.height = 270;
    cv.dataset.color = def.color;
    card.appendChild(cv);

    const name = document.createElement('input');
    name.className = 'pname';
    name.value = prof.name;
    name.maxLength = 14;
    if (def.guest) {
      name.readOnly = true;
      name.tabIndex = -1;
    } else {
      name.title = 'Kliknij, aby zmienić imię';
      name.addEventListener('click', e => e.stopPropagation());
      name.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') name.blur(); });
      name.addEventListener('change', () => {
        prof.name = name.value.trim() || def.defaultName;
        name.value = prof.name;
        Store.persist(def.id);
      });
    }
    card.appendChild(name);

    const info = document.createElement('div');
    info.className = 'pinfo';
    info.textContent = def.guest ? 'gra bez zapisywania' : (prof.best ? `rekord: ${prof.best} pkt` : 'nowy gracz');
    card.appendChild(info);

    const choose = () => { Sound.init(); openSettings(def.id); };
    card.addEventListener('click', choose);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
    wrap.appendChild(card);
  }
}

function drawMenuUfos(t) {
  document.querySelectorAll('.player-card canvas').forEach((cv, i) => {
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(2, 0, 0, 2, 0, 0);
    drawUfo(c, 90, 82 + Math.sin(t * 2 + i) * 5, 1.15, cv.dataset.color, t + i, Math.sin(t * 1.5 + i) * 0.06);
  });
  if (game.state === 'settings') {
    const cv = $('settings-ufo');
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    drawUfo(c, 60, 62 + Math.sin(t * 2) * 3, 0.8, playerDef(game.playerId).color, t);
  }
}

function goMenu() {
  game.state = 'menu';
  fireworks.stop();
  game.ships = [];
  buildMenu();
  showScreen('screen-menu');
}

/* ------------------------------------------------------------------ */
/* Ustawienia                                                           */
/* ------------------------------------------------------------------ */

function openSettings(id) {
  game.playerId = id;
  game.profile = Store.profile(id);
  game.state = 'settings';
  const def = playerDef(id);
  $('settings-title').textContent = `${game.profile.name} – ustawienia gry`;
  $('settings-title').style.color = def.color;
  $('settings-note').textContent = def.guest
    ? 'Gość: ustawienia obowiązują tylko do zamknięcia gry.'
    : 'Ustawienia zostaną zapamiętane na następny raz.';
  fillSettingsForm(game.profile.settings);
  renderWeak();
  $('settings-error').textContent = '';
  showScreen('screen-settings');
}

function fillSettingsForm(s) {
  $('set-speed').value = s.speed; $('out-speed').textContent = s.speed;
  $('set-rate').value = s.rate; $('out-rate').textContent = s.rate;
  for (const op of Object.keys(OPS)) $('op-' + op).checked = !!s.ops[op];
  $('add-min').value = s.ranges.add.min; $('add-max').value = s.ranges.add.max;
  $('sub-min').value = s.ranges.sub.min; $('sub-max').value = s.ranges.sub.max;
  $('mul-min').value = s.ranges.mul.min; $('mul-max').value = s.ranges.mul.max;
  $('div-min').value = s.ranges.div.min; $('div-max').value = s.ranges.div.max;
  $('div-dmax').value = s.ranges.div.dividendMax;
  updateOpRows();
}

function updateOpRows() {
  for (const op of Object.keys(OPS)) $('op-' + op).closest('.op-row').classList.toggle('off', !$('op-' + op).checked);
}

function readSettingsForm() {
  const num = id => {
    const v = parseInt($(id).value, 10);
    return Number.isFinite(v) ? v : NaN;
  };
  const s = {
    speed: num('set-speed'),
    rate: num('set-rate'),
    ops: {},
    ranges: {
      add: { min: num('add-min'), max: num('add-max') },
      sub: { min: num('sub-min'), max: num('sub-max') },
      mul: { min: num('mul-min'), max: num('mul-max') },
      div: { min: num('div-min'), max: num('div-max'), dividendMax: num('div-dmax') },
    }
  };
  for (const op of Object.keys(OPS)) s.ops[op] = $('op-' + op).checked;

  if (!Object.values(s.ops).some(Boolean)) return { error: 'Zaznacz przynajmniej jedno działanie.' };
  const r = s.ranges;
  for (const op of Object.keys(r)) for (const f of Object.keys(r[op])) {
    if (!Number.isFinite(r[op][f]) || r[op][f] < 0) return { error: `${OPS[op].name}: wpisz poprawne liczby (od 0 wzwyż).` };
  }
  if (r.add.max < 1 || r.add.max > 100000) return { error: 'Dodawanie: wynik musi być od 1 do 100000.' };
  if (r.add.min * 2 > r.add.max) return { error: 'Dodawanie: dwa najmniejsze składniki muszą się zmieścić w wyniku.' };
  if (r.sub.max < 1 || r.sub.max > 100000) return { error: 'Odejmowanie: górna granica musi być od 1 do 100000.' };
  if (r.sub.min > r.sub.max) return { error: 'Odejmowanie: „od” nie może być większe niż „do”.' };
  if (r.mul.max > 1000) return { error: 'Mnożenie: czynniki najwyżej do 1000.' };
  if (r.mul.min > r.mul.max) return { error: 'Mnożenie: „od” nie może być większe niż „do”.' };
  if (r.div.min < 1) return { error: 'Dzielenie: nie dzielimy przez 0 – dzielnik od 1.' };
  if (r.div.min > r.div.max) return { error: 'Dzielenie: „od” nie może być większe niż „do”.' };
  if (r.div.dividendMax < r.div.min) return { error: 'Dzielenie: dzielna musi być co najmniej równa dzielnikowi.' };
  if (r.div.dividendMax > 1000000) return { error: 'Dzielenie: dzielna najwyżej do 1000000.' };
  return { settings: s };
}

function weakSorted(weak) {
  return Object.values(weak).sort((a, b) => b.n - a.n);
}

function renderWeak() {
  const list = weakSorted(game.profile.weak).slice(0, 12);
  const el = $('weak-list');
  el.innerHTML = list.length
    ? list.map(w => `<span class="weak-item">${makeProblem(w.op, w.a, w.b).text}</span>`).join('')
    : '<i>brak – świetnie!</i>';
  $('btn-weak-clear').classList.toggle('hidden', !list.length);
}

$('set-speed').addEventListener('input', e => $('out-speed').textContent = e.target.value);
$('set-rate').addEventListener('input', e => $('out-rate').textContent = e.target.value);
for (const op of Object.keys(OPS)) $('op-' + op).addEventListener('change', updateOpRows);
$('btn-back').addEventListener('click', goMenu);
$('btn-defaults').addEventListener('click', () => { fillSettingsForm(cloneDeep(DEFAULT_SETTINGS)); $('settings-error').textContent = ''; });
$('btn-weak-clear').addEventListener('click', () => {
  game.profile.weak = {};
  Store.persist(game.playerId);
  renderWeak();
});
$('btn-start').addEventListener('click', () => {
  const res = readSettingsForm();
  if (res.error) { $('settings-error').textContent = res.error; Sound.wrong(); return; }
  game.profile.settings = res.settings;
  Store.persist(game.playerId);
  startGame();
});

/* ------------------------------------------------------------------ */
/* Rozgrywka                                                            */
/* ------------------------------------------------------------------ */

function startGame() {
  Sound.init();
  game.settings = game.profile.settings;
  game.level = 1;
  game.score = 0;
  game.stats = { hits: 0, escaped: 0, wrong: 0, startedAt: Date.now() };
  game.ships = [];
  game.lasers = [];
  game.texts = [];
  game.input = '';
  game.spawnTimer = 0.8;
  game.victoryShown = false;
  game.ufo.x = game.ufo.targetX = W / 2;
  particles.list = []; particles.rings = [];
  fireworks.stop();
  setBackground(1);
  game.state = 'playing';
  showScreen(null);
  showBanner(`Plansza 1`, themeFor(1).title, 2.2);
}

function setBackground(level) {
  if (game.bgLevel !== level) {
    game.bg = renderBackground(level);
    game.bgLevel = level;
  }
}

function shipSpeed() {
  const v = game.settings.speed;
  return (28 + v * 13) * (1 + 0.1 * (game.level - 1));
}

function spawnInterval() {
  const r = game.settings.rate;
  return (7.6 - r * 0.6) / (1 + 0.1 * (game.level - 1));
}

function spawnShip() {
  const avoid = { keys: new Set(), answers: new Set() };
  for (const s of game.ships) { avoid.keys.add(s.problem.key); avoid.answers.add(s.problem.answer); }

  // wolne pasy: żaden statek w pasie nie jest jeszcze przy lewej krawędzi
  const free = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    const inLane = game.ships.filter(s => s.lane === i);
    if (inLane.every(s => s.x > 60)) free.push(i);
  }
  if (!free.length) return false;
  // preferuj pasy, gdzie jest najmniej statków
  free.sort((a, b) => game.ships.filter(s => s.lane === a).length - game.ships.filter(s => s.lane === b).length
    || Math.random() - 0.5);
  const lane = free[Math.floor(Math.random() * Math.min(3, free.length))];

  const problem = generateProblem(game.settings, game.level, game.profile.weak, avoid);
  const w = shipLength(ctx, problem.text);
  game.ships.push({
    problem, lane, w,
    x: -w - 20,
    y: LANE_TOP + lane * LANE_GAP + (Math.random() * 10 - 5),
    color: SHIP_COLORS[Math.floor(Math.random() * SHIP_COLORS.length)],
    seed: Math.random() * 100,
  });
  return true;
}

function addWeak(p, amount) {
  const weak = game.profile.weak;
  const w = weak[p.key];
  if (amount > 0) {
    if (w) w.n = Math.min(6, w.n + amount);
    else weak[p.key] = { op: p.op, a: p.a, b: p.b, n: amount };
  } else if (w) {
    w.n += amount;
    if (w.n <= 0) delete weak[p.key];
  }
  // ograniczamy listę do 40 najczęstszych
  const keys = Object.keys(weak);
  if (keys.length > 40) {
    weakSorted(weak).slice(40).forEach(x => delete weak[x.op + ':' + x.a + ':' + x.b]);
  }
  Store.persist(game.playerId);
}

function submitAnswer() {
  if (!game.input) return;
  const val = parseInt(game.input, 10);
  game.input = '';
  const targets = game.ships.filter(s => s.problem.answer === val);
  if (!targets.length) {
    game.stats.wrong++;
    game.inputShake = 0.4;
    game.inputFlash = 0.4;
    Sound.wrong();
    return;
  }
  // zestrzel statek najbliżej prawej krawędzi
  const ship = targets.reduce((a, b) => (a.x + a.w > b.x + b.w ? a : b));
  shoot(ship);
}

function shoot(ship) {
  const cx = ship.x + ship.w / 2, cy = ship.y;
  game.ufo.targetX = Math.max(80, Math.min(W - 80, cx));
  game.lasers.push({ x1: game.ufo.x, y1: UFO_Y - 40, x2: cx, y2: cy, life: 0.25, color: playerDef(game.playerId).color });
  Sound.laser();
  Sound.boom();
  particles.explosion(cx, cy, ship.color);
  game.ships = game.ships.filter(s => s !== ship);
  game.score += 1;
  game.stats.hits++;
  game.texts.push({ x: cx, y: cy - 30, text: '+1', color: '#7dffa5', life: 1.1 });
  addWeak(ship.problem, -1);
  checkLevel();
}

function shipEscaped(ship) {
  game.score -= 1;
  game.stats.escaped++;
  game.edgeFlash = 0.5;
  game.texts.push({ x: W - 60, y: ship.y, text: '−1', color: '#ff6b7a', life: 1.3, sub: `${ship.problem.text} = ${ship.problem.answer}` });
  Sound.escape();
  addWeak(ship.problem, 1);
}

function checkLevel() {
  if (game.score >= game.level * POINTS_PER_LEVEL) levelUp();
}

function levelUp() {
  // wszystkie statki na ekranie wybuchają (bez punktów)
  for (const s of game.ships) particles.explosion(s.x + s.w / 2, s.y, s.color);
  game.ships = [];
  game.input = '';
  const finished = game.level;
  game.level++;
  setBackground(game.level);
  Sound.levelUp();
  fireworks.start();
  for (let i = 0; i < 4; i++) fireworks.launch();

  if (finished === LEVELS_TO_WIN && !game.victoryShown) {
    game.victoryShown = true;
    game.state = 'victory';
    Sound.victory();
    $('victory-stats').innerHTML = `Punkty: <b>${game.score}</b> · zestrzelone statki: <b>${game.stats.hits}</b>`;
    showScreen('screen-victory');
    saveBest();
    return;
  }
  game.state = 'levelup';
  game.levelTimer = 4.2;
  showBanner(`Poziom ${game.level}!`, themeFor(game.level).title, 4.2, true);
}

function continueAfterVictory() {
  fireworks.stop();
  game.state = 'playing';
  game.spawnTimer = 1;
  showScreen(null);
  showBanner(`Plansza ${game.level}`, themeFor(game.level).title, 2.2);
}

function saveBest() {
  if (game.score > game.profile.best) {
    game.profile.best = game.score;
    Store.persist(game.playerId);
  }
}

function pause() {
  if (game.state !== 'playing' && game.state !== 'levelup') return;
  game.prevState = game.state;
  game.state = 'paused';
  showScreen('screen-pause');
}
function resume() {
  if (game.state !== 'paused') return;
  game.state = game.prevState || 'playing';
  showScreen(null);
}

function endGame() {
  saveBest();
  fireworks.stop();
  game.state = 'summary';
  const st = game.stats;
  const tries = st.hits + st.wrong + st.escaped;
  const acc = tries ? Math.round(100 * st.hits / tries) : 0;
  const mins = Math.max(0, Math.round((Date.now() - st.startedAt) / 60000));
  $('summary-stats').innerHTML = `
    <span>Gracz</span><b style="color:${playerDef(game.playerId).color}">${escapeHtml(game.profile.name)}</b>
    <span>Punkty</span><b>${game.score}</b>
    <span>Plansza</span><b>${game.level}</b>
    <span>Zestrzelone statki</span><b>${st.hits}</b>
    <span>Statki, które uciekły</span><b>${st.escaped}</b>
    <span>Błędne odpowiedzi</span><b>${st.wrong}</b>
    <span>Skuteczność</span><b>${acc}%</b>
    <span>Czas gry</span><b>${mins} min</b>
    ${playerDef(game.playerId).guest ? '' : `<span>Rekord</span><b>${game.profile.best}</b>`}`;
  const weak = weakSorted(game.profile.weak).slice(0, 10);
  $('summary-weak').innerHTML = weak.length
    ? `<span class="weak-label">Do powtórki:</span><span class="weak-list">${weak.map(w => {
        const p = makeProblem(w.op, w.a, w.b);
        return `<span class="weak-item">${p.text} = ${p.answer}</span>`;
      }).join('')}</span>`
    : '<span class="weak-label">Nie ma działań do powtórki – super!</span>';
  showScreen('screen-summary');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Napis na środku ekranu (początek planszy / nowy poziom) */
let banner = null;
function showBanner(title, sub, dur, big = false) {
  banner = { title, sub, life: dur, max: dur, big };
}

/* ------------------------------------------------------------------ */
/* Klawiatura                                                           */
/* ------------------------------------------------------------------ */

window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;

  if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }

  if (game.state === 'paused') {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') resume();
    return;
  }
  if (game.state === 'victory') {
    if (e.key === 'Enter') continueAfterVictory();
    return;
  }
  if (game.state !== 'playing' && game.state !== 'levelup') return;

  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { pause(); e.preventDefault(); return; }
  if (game.state !== 'playing') return;

  if (/^[0-9]$/.test(e.key)) {
    if (game.input.length < 7) { game.input += e.key; Sound.key(); }
    e.preventDefault();
  } else if (e.key === 'Backspace') {
    game.input = game.input.slice(0, -1);
    e.preventDefault();
  } else if (e.key === 'Delete') {
    game.input = '';
  } else if (e.key === 'Enter' || e.key === ' ') {
    submitAnswer();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    game.keys[e.key] = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => { game.keys[e.key] = false; });

function toggleMute() {
  Sound.muted = !Sound.muted;
  Store.setMuted(Sound.muted);
  $('btn-mute').textContent = Sound.muted ? '🔇' : '🔊';
}

$('btn-mute').addEventListener('click', e => { toggleMute(); e.currentTarget.blur(); });
$('btn-pause').addEventListener('click', e => { pause(); e.currentTarget.blur(); });
$('btn-resume').addEventListener('click', resume);
$('btn-quit').addEventListener('click', endGame);
$('btn-continue').addEventListener('click', continueAfterVictory);
$('btn-finish').addEventListener('click', endGame);
$('btn-again').addEventListener('click', startGame);
$('btn-menu').addEventListener('click', goMenu);

/* ------------------------------------------------------------------ */
/* Pętla gry                                                            */
/* ------------------------------------------------------------------ */

function update(dt) {
  game.time += dt;
  starfield.update(dt);
  particles.update(dt);
  fireworks.update(dt);
  if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }

  if (game.state === 'menu' || game.state === 'settings') return;
  if (game.state === 'paused') return;

  for (const l of game.lasers) l.life -= dt;
  game.lasers = game.lasers.filter(l => l.life > 0);
  for (const t of game.texts) { t.life -= dt; t.y -= 30 * dt; }
  game.texts = game.texts.filter(t => t.life > 0);
  game.inputShake = Math.max(0, game.inputShake - dt);
  game.inputFlash = Math.max(0, game.inputFlash - dt);
  game.edgeFlash = Math.max(0, game.edgeFlash - dt);

  // ufoludek
  const u = game.ufo;
  if (game.keys.ArrowLeft) u.targetX -= 520 * dt;
  if (game.keys.ArrowRight) u.targetX += 520 * dt;
  u.targetX = Math.max(80, Math.min(W - 80, u.targetX));
  const dx = u.targetX - u.x;
  u.x += dx * Math.min(1, dt * 8);
  u.tilt += (Math.max(-0.35, Math.min(0.35, dx * 0.004)) - u.tilt) * Math.min(1, dt * 10);

  if (game.state === 'levelup') {
    game.levelTimer -= dt;
    if (game.levelTimer <= 0) {
      fireworks.stop();
      game.state = 'playing';
      game.spawnTimer = 0.6;
    }
    return;
  }
  if (game.state !== 'playing') return;

  // statki
  const sp = shipSpeed();
  for (const s of game.ships) s.x += sp * dt;
  const escaped = game.ships.filter(s => s.x > W + 10);
  if (escaped.length) {
    game.ships = game.ships.filter(s => s.x <= W + 10);
    escaped.forEach(shipEscaped);
  }

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 || game.ships.length === 0 && game.spawnTimer < spawnInterval() - 1.2) {
    if (spawnShip()) game.spawnTimer = spawnInterval() * (0.8 + Math.random() * 0.4);
    else game.spawnTimer = 0.3;
  }
}

function draw() {
  const t = game.time;
  ctx.clearRect(0, 0, W, H);

  if (game.bg && game.state !== 'menu' && game.state !== 'settings') {
    ctx.drawImage(game.bg, 0, 0, W, H);
  } else {
    if (!game.menuBg) game.menuBg = renderBackground(3);
    ctx.drawImage(game.menuBg, 0, 0, W, H);
  }
  starfield.draw(ctx);

  if (game.state === 'menu' || game.state === 'settings') {
    particles.draw(ctx);
    drawMenuUfos(t);
    return;
  }

  // statki
  for (const s of game.ships) drawShip(ctx, s, t);

  // lasery
  for (const l of game.lasers) {
    const a = l.life / 0.25;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = l.color;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = a;
    ctx.lineWidth = 10 * a;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * a;
    ctx.stroke();
    ctx.restore();
  }

  particles.draw(ctx);
  fireworks.draw(ctx);

  // czerwony błysk z prawej, gdy statek ucieknie
  if (game.edgeFlash > 0) {
    const g = ctx.createLinearGradient(W - 120, 0, W, 0);
    g.addColorStop(0, 'rgba(255,40,60,0)');
    g.addColorStop(1, `rgba(255,40,60,${game.edgeFlash})`);
    ctx.fillStyle = g;
    ctx.fillRect(W - 120, 0, 120, H);
  }

  // ufoludek
  const color = playerDef(game.playerId).color;
  drawUfo(ctx, game.ufo.x, UFO_Y + Math.sin(t * 2) * 4, 1, color, t, game.ufo.tilt);

  drawInput(color, t);

  // pływające napisy
  for (const tx of game.texts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, tx.life * 2);
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = tx.sub ? 'right' : 'center';
    ctx.fillStyle = tx.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(tx.text, tx.x, tx.y);
    ctx.fillText(tx.text, tx.x, tx.y);
    if (tx.sub) {
      ctx.font = `600 20px ${FONT}`;
      ctx.strokeText(tx.sub, tx.x, tx.y + 26);
      ctx.fillText(tx.sub, tx.x, tx.y + 26);
    }
    ctx.restore();
  }

  drawHud(color);

  if (banner) drawBanner();
}

function drawInput(color, t) {
  const shake = game.inputShake > 0 ? Math.sin(t * 60) * 8 * (game.inputShake / 0.4) : 0;
  const x = game.ufo.x + shake, y = H - 38;
  const text = game.input || '';
  ctx.font = `700 34px ${FONT}`;
  const w = Math.max(text ? 150 : 240, ctx.measureText(text).width + 70);
  roundRect(ctx, x - w / 2, y - 26, w, 52, 16);
  ctx.fillStyle = game.inputFlash > 0 ? `rgba(120,10,25,0.85)` : 'rgba(8,14,40,0.85)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = game.inputFlash > 0 ? '#ff5a6a' : color;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (text) {
    ctx.fillStyle = '#ffffff';
    const cursor = Math.floor(t * 2) % 2 ? '' : '_';
    ctx.fillText(text + cursor, x + (cursor ? 8 : 0), y + 2);
  } else {
    ctx.fillStyle = 'rgba(200,215,255,0.45)';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText(game.state === 'playing' ? 'wpisz wynik + Enter' : '', x, y + 2);
  }
}

function drawHud(color) {
  ctx.save();
  // pasek
  const g = ctx.createLinearGradient(0, 0, 0, 66);
  g.addColorStop(0, 'rgba(5,8,25,0.85)');
  g.addColorStop(1, 'rgba(5,8,25,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 66);

  ctx.textBaseline = 'middle';
  // gracz
  drawUfo(ctx, 42, 40, 0.42, color, game.time);
  ctx.font = `600 24px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.fillText(game.profile.name, 76, 32);

  // poziom i postęp
  const th = themeFor(game.level);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8f0ff';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(`Plansza ${game.level} · ${th.title}`, W / 2, 22);
  const bw = 300, bx = W / 2 - bw / 2, by = 40;
  const base = (game.level - 1) * POINTS_PER_LEVEL;
  const prog = Math.max(0, Math.min(1, (game.score - base) / POINTS_PER_LEVEL));
  roundRect(ctx, bx, by, bw, 14, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  if (prog > 0) {
    roundRect(ctx, bx, by, Math.max(14, bw * prog), 14, 7);
    const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    pg.addColorStop(0, '#7cf3ff');
    pg.addColorStop(1, '#ff7ce0');
    ctx.fillStyle = pg;
    ctx.fill();
  }
  // gwiazdki ukończonych plansz (do 5)
  ctx.font = `20px ${FONT}`;
  for (let i = 0; i < LEVELS_TO_WIN; i++) {
    ctx.fillStyle = i < game.level - 1 ? '#ffd84a' : 'rgba(255,255,255,0.2)';
    ctx.fillText('★', bx + bw + 24 + i * 22, by + 7);
  }

  // punkty
  ctx.textAlign = 'right';
  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = game.score < 0 ? '#ff6b7a' : '#ffffff';
  ctx.fillText(`${game.score} pkt`, W - 130, 34);
  ctx.restore();
}

function drawBanner() {
  const b = banner;
  const elapsed = b.max - b.life;
  const a = Math.min(1, elapsed * 3, b.life * 2);
  const sc = b.big ? 1 + 0.15 * Math.max(0, 1 - elapsed * 2.5) : 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, H / 2 - 60);
  ctx.scale(sc, sc);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${b.big ? 86 : 64}px ${FONT}`;
  ctx.shadowColor = b.big ? '#ffd84a' : '#7cf3ff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = b.big ? '#fff3b0' : '#e8fbff';
  ctx.fillText(b.title, 0, 0);
  ctx.shadowBlur = 12;
  ctx.font = `600 32px ${FONT}`;
  ctx.fillStyle = '#c9d8ff';
  ctx.fillText(b.sub, 0, b.big ? 70 : 56);
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ */
/* Start                                                                */
/* ------------------------------------------------------------------ */

Store.load();
Sound.muted = Store.data.muted;
$('btn-mute').textContent = Sound.muted ? '🔇' : '🔊';
resize();
buildMenu();
showScreen('screen-menu');
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { game.menuBg = null; });
