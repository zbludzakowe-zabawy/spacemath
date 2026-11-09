'use strict';
/*
 * Kampania: 20 poziomów ułożonych według klas szkoły podstawowej.
 * Każdy poziom ma na stałe wpisane działania, prędkość statków (V)
 * i częstotliwość (R) – ustawienia gracza nie mają tu znaczenia.
 */

const CAMPAIGN_LEVELS_COUNT = 20;

/* --- pomocnicze generatory ------------------------------------------- */

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const tens = (lo, hi) => 10 * randInt(lo, hi); // pełne dziesiątki: tens(1,9) -> 10..90

/** Losowa kolejność czynników (4 × 7 albo 7 × 4). */
function mulAnyOrder(a, b) { return Math.random() < 0.5 ? makeProblem('mul', a, b) : makeProblem('mul', b, a); }
/** Dzielenie bez reszty: dzielnik d, iloraz q. */
function divBy(d, q) { return makeProblem('div', d * q, d); }

const G = {
  // dodawanie z wynikiem do max (oba składniki >= lo)
  addUpTo(max, lo = 1) {
    const a = randInt(lo, max - lo);
    return makeProblem('add', a, randInt(lo, max - a));
  },
  // odejmowanie liczb do max (wynik >= 0)
  subUpTo(max, lo = 1) {
    const a = randInt(lo, max);
    return makeProblem('sub', a, randInt(Math.min(lo, a), a));
  },
  // do 20 bez przekraczania progu: 13 + 4, 4 + 13, 18 − 5
  add20NoCarry() {
    const u = randInt(0, 8);
    const a = 10 + u, b = randInt(1, 9 - u);
    return Math.random() < 0.7 ? makeProblem('add', a, b) : makeProblem('add', b, a);
  },
  sub20NoCarry() {
    const a = randInt(11, 19);
    return makeProblem('sub', a, randInt(1, a % 10 || 1));
  },
  // do 20 z przekraczaniem progu: 8 + 7, 15 − 9
  add20Carry() {
    const a = randInt(2, 9);
    return makeProblem('add', a, randInt(11 - a, 9));
  },
  sub20Carry() {
    const a = randInt(11, 18);
    return makeProblem('sub', a, randInt(a % 10 + 1, 9));
  },
  // pełne dziesiątki do 100: 30 + 50, 90 − 40
  addTens100() { const a = tens(1, 9); return makeProblem('add', a, tens(1, 10 - a / 10)); },
  subTens100() { const a = tens(2, 10); return makeProblem('sub', a, tens(1, a / 10 - 1)); },
  // dwucyfrowa ± jednocyfrowa do 100: 47 + 6, 52 − 8
  add2d1d() { const a = randInt(10, 94); const b = randInt(1, Math.min(9, 100 - a)); return Math.random() < 0.8 ? makeProblem('add', a, b) : makeProblem('add', b, a); },
  sub2d1d() { return makeProblem('sub', randInt(11, 100), randInt(2, 9)); },
  // dwucyfrowa ± dwucyfrowa do 100: 47 + 38, 83 − 29
  add2d2d() { const a = randInt(10, 89); return makeProblem('add', a, randInt(10, 100 - a)); },
  sub2d2d() { const a = randInt(21, 99); return makeProblem('sub', a, randInt(10, a - 1)); },
  // tabliczka mnożenia
  mulTable(fmin, fmax) { return mulAnyOrder(randInt(fmin, fmax), randInt(1, 10)); },
  divTable(dmin, dmax) { return divBy(randInt(dmin, dmax), randInt(1, 10)); },
  // do 1000 pełnymi setkami i dziesiątkami: 450 + 230, 700 − 260
  addTens1000() { const a = tens(10, 98); return makeProblem('add', a, tens(1, 100 - a / 10)); },
  subTens1000() { const a = tens(11, 100); return makeProblem('sub', a, tens(1, a / 10 - 1)); },
  // × i : przez 10 i 100, pełne dziesiątki: 30 × 4, 240 : 6, 35 × 10, 700 : 100
  mulTens() {
    switch (randInt(0, 2)) {
      case 0: return mulAnyOrder(tens(1, 9), randInt(2, 9));
      case 1: return mulAnyOrder(randInt(2, 99), 10);
      default: return mulAnyOrder(randInt(2, 9), 100);
    }
  },
  divTens() {
    switch (randInt(0, 2)) {
      case 0: return divBy(randInt(2, 9), tens(1, 9));
      case 1: return divBy(10, randInt(2, 99));
      default: return divBy(100, randInt(2, 9));
    }
  },
  // dwucyfrowa × jednocyfrowa: 14 × 6
  mul2d1d(amax = 25) { return mulAnyOrder(randInt(11, amax), randInt(2, 9)); },
  // dzielna do 100, iloraz dwucyfrowy: 84 : 4
  div100() { const d = randInt(2, 9); return divBy(d, randInt(11, Math.floor(100 / d))); },
  // do 1000 dowolne: 367 + 248, 815 − 469
  add3d() { const a = randInt(100, 899); return makeProblem('add', a, randInt(100, 1000 - a)); },
  sub3d() { const a = randInt(201, 1000); return makeProblem('sub', a, randInt(100, a - 1)); },
  // trzycyfrowa : jednocyfrowa: 852 : 6
  div3d1d() { const d = randInt(2, 9); return divBy(d, randInt(Math.ceil(100 / d), Math.floor(999 / d))); },
  // do 20 × 20: 15 × 12, 17 × 17
  mulTeens() { return makeProblem('mul', randInt(11, 20), randInt(11, 20)); },
  // trzycyfrowa : liczba od 11 do 20: 144 : 12
  divTeens() { return divBy(randInt(11, 20), randInt(2, 20)); },
};

/* --- poziomy ---------------------------------------------------------- */
// gens: lista generatorów; każde działanie losuje jeden z nich (równe szanse).

const CAMPAIGN = [
  { grade: 1, ops: '+',       desc: '+ do 10',                                       ex: '4 + 5',               v: 2, r: 2, gens: [() => G.addUpTo(10)] },
  { grade: 1, ops: '+ −',     desc: '+ − do 10',                                     ex: '9 − 3',               v: 3, r: 3, gens: [() => G.addUpTo(10), () => G.subUpTo(10)] },
  { grade: 1, ops: '+ −',     desc: '+ − do 20, bez przekraczania 10',               ex: '13 + 4, 18 − 5',      v: 3, r: 3, gens: [G.add20NoCarry, G.sub20NoCarry] },
  { grade: 1, ops: '+ −',     desc: '+ − do 20, z przekraczaniem 10',                ex: '8 + 7, 15 − 9',       v: 4, r: 4, gens: [G.add20Carry, G.sub20Carry] },
  { grade: 2, ops: '+ −',     desc: '+ − pełnymi dziesiątkami do 100',               ex: '30 + 50, 90 − 40',    v: 3, r: 3, gens: [G.addTens100, G.subTens100] },
  { grade: 2, ops: '+ −',     desc: '+ − do 100: dwucyfrowa ± jednocyfrowa',         ex: '47 + 6, 52 − 8',      v: 4, r: 4, gens: [G.add2d1d, G.sub2d1d] },
  { grade: 2, ops: '×',       desc: '× od ×2 do ×5 (wynik do 50)',                   ex: '4 × 7',               v: 3, r: 3, gens: [() => G.mulTable(2, 5)] },
  { grade: 2, ops: '× : + −', desc: '× : do 50 + powtórka + −',                      ex: '35 : 5',              v: 4, r: 4, gens: [() => G.mulTable(2, 5), () => G.divTable(2, 5), G.add2d1d, G.sub2d1d] },
  { grade: 3, ops: '+ −',     desc: '+ − do 100: dwucyfrowa ± dwucyfrowa',           ex: '47 + 38, 83 − 29',    v: 4, r: 4, gens: [G.add2d2d, G.sub2d2d] },
  { grade: 3, ops: '×',       desc: '× cała tabliczka mnożenia',                     ex: '7 × 8',               v: 4, r: 4, gens: [() => G.mulTable(1, 10)] },
  { grade: 3, ops: ':',       desc: ': w zakresie tabliczki',                        ex: '56 : 7',              v: 4, r: 4, gens: [() => G.divTable(2, 10)] },
  { grade: 3, ops: '+ − × :', desc: 'wszystkie 4 działania do 100',                  ex: 'mieszanka',           v: 5, r: 5, gens: [() => G.addUpTo(100), () => G.subUpTo(100), () => G.mulTable(1, 10), () => G.divTable(2, 10)] },
  { grade: 4, ops: '+ −',     desc: '+ − do 1000 pełnymi setkami i dziesiątkami',    ex: '450 + 230',           v: 5, r: 5, gens: [G.addTens1000, G.subTens1000] },
  { grade: 4, ops: '× :',     desc: '× : przez 10 i 100, pełnymi dziesiątkami',      ex: '30 × 4, 240 : 6',     v: 5, r: 5, gens: [G.mulTens, G.divTens] },
  { grade: 4, ops: '× :',     desc: 'dwucyfrowa × jednocyfrowa, dzielna do 100',     ex: '14 × 6, 84 : 4',      v: 5, r: 5, gens: [() => G.mul2d1d(25), G.div100] },
  { grade: 5, ops: '+ −',     desc: '+ − do 1000, dowolne liczby',                   ex: '367 + 248',           v: 6, r: 5, gens: [G.add3d, G.sub3d] },
  { grade: 5, ops: ':',       desc: 'trzycyfrowa : jednocyfrowa',                    ex: '852 : 6',             v: 6, r: 6, gens: [G.div3d1d] },
  { grade: 6, ops: '×',       desc: '× do 20 × 20',                                  ex: '15 × 12, 17 × 17',    v: 6, r: 6, gens: [G.mulTeens] },
  { grade: 7, ops: '+ − × :', desc: 'wszystkie działania, większe liczby',           ex: 'mieszanka',           v: 7, r: 7, gens: [G.add3d, G.sub3d, () => G.mul2d1d(99), G.div3d1d] },
  { grade: 8, ops: '+ − × :', desc: '„Mistrz”: wszystko, szybko',                    ex: 'mieszanka',           v: 8, r: 8, gens: [G.add3d, G.sub3d, G.mulTeens, () => G.mul2d1d(99), G.div3d1d, G.divTeens] },
].map((l, i) => ({ ...l, level: i + 1 }));

/** Pierwszy poziom danej klasy (1–8). */
function firstLevelOfGrade(grade) {
  const l = CAMPAIGN.find(x => x.grade === grade);
  return l ? l.level : 1;
}

function campaignLevel(level) {
  return CAMPAIGN[Math.max(1, Math.min(CAMPAIGN_LEVELS_COUNT, level)) - 1];
}

/**
 * Losuje działanie dla poziomu kampanii.
 * Działania „do powtórki” wracają, jeśli pochodzą z tego poziomu
 * albo z niedawnych, łatwiejszych poziomów kampanii.
 */
function generateCampaignProblem(level, weak, avoid) {
  const L = campaignLevel(level);

  const weakList = Object.values(weak || {}).filter(w =>
    Number.isFinite(w.lv) && w.lv <= L.level && L.level - w.lv <= 3 &&
    !avoid.keys.has(w.op + ':' + w.a + ':' + w.b));
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
  for (let tries = 0; tries < 20; tries++) {
    p = pick(L.gens)();
    if (!avoid.keys.has(p.key) && !avoid.answers.has(p.answer)) return p;
  }
  return p;
}

if (typeof module !== 'undefined') {
  module.exports = { CAMPAIGN, CAMPAIGN_LEVELS_COUNT, firstLevelOfGrade, campaignLevel, generateCampaignProblem };
}
