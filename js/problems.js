'use strict';
/*
 * Generowanie działań.
 * Ustawienia gracza określają zakres na 1. planszy; z każdą kolejną planszą
 * zakres rośnie, a małe (łatwe) liczby pojawiają się rzadziej.
 */

const OPS = {
  add: { sym: '+', name: 'Dodawanie' },
  sub: { sym: '−', name: 'Odejmowanie' },
  mul: { sym: '×', name: 'Mnożenie' },
  div: { sym: ':', name: 'Dzielenie' },
};

function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

function makeProblem(op, a, b) {
  let answer;
  switch (op) {
    case 'add': answer = a + b; break;
    case 'sub': answer = a - b; break;
    case 'mul': answer = a * b; break;
    case 'div': answer = a / b; break;
  }
  return { op, a, b, answer, key: op + ':' + a + ':' + b, text: a + ' ' + OPS[op].sym + ' ' + b };
}

/** Zakresy dla danej planszy (level od 1). */
function levelRanges(ranges, level) {
  const k = Math.max(0, level - 1);
  const r = {};

  // Dodawanie: wynik do max, składniki od min
  {
    const max = Math.max(1, Math.round(ranges.add.max * (1 + 0.25 * k)));
    let min = Math.max(ranges.add.min, Math.round(max * 0.06 * k));
    min = Math.min(min, Math.floor(max / 2));
    r.add = { min, max };
  }
  // Odejmowanie: liczby w [min, max], wynik >= 0
  {
    const max = Math.max(1, Math.round(ranges.sub.max * (1 + 0.25 * k)));
    let min = Math.max(ranges.sub.min, Math.round(max * 0.06 * k));
    min = Math.min(min, max);
    r.sub = { min, max };
  }
  // Mnożenie: czynniki w [min, max]
  {
    const max = ranges.mul.max + k;
    let min = Math.min(ranges.mul.min + k, max - 2);
    min = Math.max(min, Math.min(ranges.mul.min, max));
    r.mul = { min, max };
  }
  // Dzielenie: dzielnik [min, max], dzielna do dividendMax; od 2. planszy bez dzielenia przez 1
  {
    const max = Math.max(1, ranges.div.max);
    let min = Math.max(1, ranges.div.min);
    if (k > 0) min = Math.max(min, 2);
    min = Math.min(min, max);
    r.div = { min, max, dividendMax: Math.max(1, ranges.div.dividendMax), k };
  }
  return r;
}

function genAdd(r) {
  const a = randInt(r.min, r.max - r.min);
  const b = randInt(r.min, r.max - a);
  return makeProblem('add', a, b);
}

function genSub(r) {
  const a = randInt(Math.max(r.min, Math.min(1, r.max)), r.max);
  const b = randInt(Math.min(r.min, a), a);
  return makeProblem('sub', a, b);
}

function genMul(r) {
  return makeProblem('mul', randInt(r.min, r.max), randInt(r.min, r.max));
}

function genDiv(r) {
  const d = randInt(r.min, r.max);
  const M = r.dividendMax;
  const maxDigits = String(M).length;
  // losujemy liczbę cyfr dzielnej (na wyższych planszach częściej dłuższe liczby)
  const options = [];
  for (let n = 1; n <= maxDigits; n++) {
    const lo = n === 1 ? 1 : Math.pow(10, n - 1);
    const hi = Math.min(Math.pow(10, n) - 1, M);
    const qlo = Math.ceil(lo / d), qhi = Math.floor(hi / d);
    if (qlo <= qhi) options.push({ qlo, qhi, w: 1 + r.k * 0.6 * (n - 1) });
  }
  if (!options.length) return makeProblem('div', d, d); // np. dzielna < dzielnik
  let total = options.reduce((s, o) => s + o.w, 0);
  let x = Math.random() * total, pick = options[0];
  for (const o of options) { x -= o.w; if (x <= 0) { pick = o; break; } }
  const q = randInt(pick.qlo, pick.qhi);
  return makeProblem('div', d * q, d);
}

const GENERATORS = { add: genAdd, sub: genSub, mul: genMul, div: genDiv };

/**
 * Losuje nowe działanie.
 * @param settings ustawienia gracza
 * @param level numer planszy
 * @param weak mapa key -> {op,a,b,n} działań, które były pudłowane
 * @param avoid { keys:Set, answers:Set } – czego unikać (statki już na ekranie)
 */
function generateProblem(settings, level, weak, avoid) {
  const enabled = Object.keys(OPS).filter(op => settings.ops[op]);
  if (!enabled.length) enabled.push('add');
  const ranges = levelRanges(settings.ranges, level);

  // Najpierw: czy powtarzamy któreś z „trudnych” działań?
  const weakList = Object.values(weak || {}).filter(w =>
    enabled.includes(w.op) && !avoid.keys.has(w.op + ':' + w.a + ':' + w.b));
  if (weakList.length && Math.random() < Math.min(0.45, 0.15 + 0.05 * weakList.length)) {
    const total = weakList.reduce((s, w) => s + w.n, 0);
    let x = Math.random() * total;
    for (const w of weakList) {
      x -= w.n;
      if (x <= 0) {
        const p = makeProblem(w.op, w.a, w.b);
        if (!avoid.answers.has(p.answer)) { p.repeat = true; return p; }
        break;
      }
    }
  }

  let p = null;
  for (let tries = 0; tries < 15; tries++) {
    const op = enabled[Math.floor(Math.random() * enabled.length)];
    p = GENERATORS[op](ranges[op]);
    if (!avoid.keys.has(p.key) && !avoid.answers.has(p.answer)) return p;
  }
  return p;
}

if (typeof module !== 'undefined') {
  module.exports = { OPS, makeProblem, levelRanges, generateProblem };
}
