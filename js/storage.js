'use strict';
/*
 * Zapis danych graczy w localStorage.
 * Niebieski = gość (nic nie jest zapamiętywane między uruchomieniami).
 * Zielony, różowy, czerwony – zapamiętujemy imię, ustawienia, najlepszy wynik
 * i listę działań, które najczęściej nie były trafiane.
 */

const PLAYERS = [
  { id: 'blue',  color: '#43a8ff', defaultName: 'Gość',     guest: true },
  { id: 'green', color: '#4be37a', defaultName: 'Zielony',  guest: false },
  { id: 'pink',  color: '#ff6ad5', defaultName: 'Różowy',   guest: false },
  { id: 'red',   color: '#ff4d4d', defaultName: 'Czerwony', guest: false },
];

const DEFAULT_SETTINGS = {
  speed: 5,          // V: 1..10
  rate: 5,           // R: 1..10
  ops: { add: true, sub: true, mul: true, div: true },
  ranges: {
    add: { min: 0, max: 100 },               // składniki >= min, wynik <= max
    sub: { min: 0, max: 100 },               // wszystkie liczby w [min, max]
    mul: { min: 0, max: 10 },                // czynniki w [min, max]
    div: { min: 1, max: 9, dividendMax: 999 } // dzielnik w [min, max], dzielna 1..dividendMax
  }
};

function cloneDeep(o) { return JSON.parse(JSON.stringify(o)); }

const Store = {
  KEY: 'mathspace.v1',
  data: null,
  guestSession: null, // dane gościa – tylko w pamięci

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    if (!d.players) d.players = {};
    if (typeof d.muted !== 'boolean') d.muted = false;
    this.data = d;
    return d;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* brak miejsca / tryb prywatny */ }
  },

  /** Zwraca obiekt profilu gracza (dla gościa – świeży, tylko w pamięci). */
  profile(id) {
    const def = PLAYERS.find(p => p.id === id);
    if (def.guest) {
      if (!this.guestSession) {
        this.guestSession = { name: def.defaultName, settings: cloneDeep(DEFAULT_SETTINGS), weak: {}, best: 0 };
      }
      normalizeCampaign(this.guestSession);
      return this.guestSession;
    }
    let p = this.data.players[id];
    if (!p) {
      p = { name: def.defaultName, settings: cloneDeep(DEFAULT_SETTINGS), weak: {}, best: 0 };
      this.data.players[id] = p;
    }
    p.settings = mergeSettings(p.settings);
    if (!p.weak) p.weak = {};
    if (typeof p.best !== 'number') p.best = 0;
    normalizeCampaign(p);
    if (!p.name) p.name = def.defaultName;
    return p;
  },

  persist(id) {
    const def = PLAYERS.find(p => p.id === id);
    if (!def.guest) this.save();
  },

  setMuted(m) { this.data.muted = m; this.save(); },

  /** Trwająca rozgrywka – żeby przeładowanie strony lub zamknięcie aplikacji jej nie przerwało. */
  saveSession(session) { this.data.session = session; this.save(); },
  clearSession() { if (this.data.session) { delete this.data.session; this.save(); } }
};

/**
 * Tryb gry i kampania: mode = 'campaign' | 'custom',
 * campaignLevel – od którego poziomu kampanii zacząć (ostatnio osiągnięty albo wybrany),
 * campaignMax – najwyższy osiągnięty poziom kampanii.
 */
// Kampania z 20 poziomami (wersja 1) -> 30 poziomów (wersja 2): stary poziom -> nowy o tej samej trudności
const CAMPAIGN_V1_TO_V2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 19, 22, 23, 26, 29, 30];

function normalizeCampaign(p) {
  if (p.mode !== 'campaign' && p.mode !== 'custom') p.mode = 'campaign';
  if (p.campaignVer !== 2) {
    const map = n => Number.isFinite(n) ? CAMPAIGN_V1_TO_V2[Math.max(0, Math.min(20, Math.round(n)))] : n;
    p.campaignLevel = map(p.campaignLevel);
    p.campaignMax = map(p.campaignMax);
    p.campaignVer = 2;
  }
  const lv = n => Number.isFinite(n) ? Math.max(1, Math.min(30, Math.round(n))) : 1;
  p.campaignLevel = lv(p.campaignLevel);
  p.campaignMax = Number.isFinite(p.campaignMax) ? Math.max(0, Math.min(30, Math.round(p.campaignMax))) : 0;
}

/** Uzupełnia brakujące pola ustawień wartościami domyślnymi. */
function mergeSettings(s) {
  const out = cloneDeep(DEFAULT_SETTINGS);
  if (!s || typeof s !== 'object') return out;
  if (Number.isFinite(s.speed)) out.speed = s.speed;
  if (Number.isFinite(s.rate)) out.rate = s.rate;
  if (s.ops) for (const k of Object.keys(out.ops)) if (typeof s.ops[k] === 'boolean') out.ops[k] = s.ops[k];
  if (s.ranges) for (const k of Object.keys(out.ranges)) {
    if (!s.ranges[k]) continue;
    for (const f of Object.keys(out.ranges[k])) {
      if (Number.isFinite(s.ranges[k][f])) out.ranges[k][f] = s.ranges[k][f];
    }
  }
  return out;
}
