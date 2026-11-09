# MathSpace

Kosmiczna gra do nauki działań matematycznych: dodawania, odejmowania, mnożenia i dzielenia.

Statki kosmiczne z działaniami (np. `12 + 98`, `80 : 4`) lecą z lewej do prawej.
Gracz steruje ufoludkiem: wpisuje wynik i naciska **Enter** – ufoludek strzela i statek wybucha.

## Jak zagrać

Gra jest opublikowana na **https://zbludzakowe-zabawy.github.io/spacemath/**.

Można też otworzyć plik `index.html` bezpośrednio w przeglądarce (Chrome, Edge, Firefox) –
nie trzeba niczego instalować.

## Aplikacja

Grę można zainstalować jak aplikację – ma wtedy własną ikonę, otwiera się w osobnym oknie
i **działa bez internetu** (bez internetu napisy mają zwykłą czcionkę).

- **Komputer (Chrome, Edge):** ikona instalacji na pasku adresu albo przycisk **Zainstaluj** w banerze w menu.
- **Android (Chrome, Edge, Samsung):** baner **Zainstaluj** – albo ⋮ → **Zainstaluj aplikację**.
- **iPhone / iPad:** w **Safari** stuknij **Udostępnij** → **Do ekranu początkowego** (gra sama to podpowie).

Na telefonie i tablecie w trakcie gry pojawia się **klawiatura z cyframi**: ⌫ kasuje cyfrę,
🚀 strzela. Najwygodniej grać z telefonem obróconym poziomo – statki są wtedy większe.

Gra **zapamiętuje trwającą rozgrywkę** (gracz, plansza, punkty). Jeśli przeładujesz stronę albo
zamkniesz aplikację, po ponownym otwarciu gra czeka na pauzie – **Graj dalej** wraca do tej samej
planszy. Gdy okno gry zostanie schowane, gra sama włącza pauzę.

Gdy opublikujemy nową wersję, gra pokaże **„Dostępna nowa wersja”**. **Odśwież** wczytuje ją od razu
(rozgrywka zostaje), **Później** – przy następnym uruchomieniu. Gra nigdy nie przeładowuje się sama.

## Publikacja

Każde scalenie zmian do gałęzi `main` publikuje grę na GitHub Pages (`.github/workflows/pages.yml`).
Jednorazowo w ustawieniach repozytorium: **Settings → Pages → Source: GitHub Actions**.

## Kampania – 20 poziomów

Na ekranie ustawień są dwie zakładki: **Kampania** i **Własne ustawienia**.
W kampanii każdy poziom ma z góry ustalone działania, prędkość statków (V) i częstotliwość (R),
ułożone według klas szkoły podstawowej. Można zacząć od **klasy (1–8)** albo od **poziomu (1–20)**;
przycisk **Zobacz tabelę wszystkich poziomów** pokazuje całą listę.

| Poz. | Klasa | Działania | Przykłady | V | R |
|---|---|---|---|---|---|
| 1 | 1 | + do 10 | 4 + 5 | 2 | 2 |
| 2 | 1 | + − do 10 | 9 − 3 | 3 | 3 |
| 3 | 1 | + − do 20, bez przekraczania 10 | 13 + 4, 18 − 5 | 3 | 3 |
| 4 | 1 | + − do 20, z przekraczaniem 10 | 8 + 7, 15 − 9 | 4 | 4 |
| 5 | 2 | + − pełnymi dziesiątkami do 100 | 30 + 50, 90 − 40 | 3 | 3 |
| 6 | 2 | + − do 100: dwucyfrowa ± jednocyfrowa | 47 + 6, 52 − 8 | 4 | 4 |
| 7 | 2 | × od ×2 do ×5 (wynik do 50) | 4 × 7 | 3 | 3 |
| 8 | 2 | × : do 50 + powtórka + − | 35 : 5 | 4 | 4 |
| 9 | 3 | + − do 100: dwucyfrowa ± dwucyfrowa | 47 + 38, 83 − 29 | 4 | 4 |
| 10 | 3 | × cała tabliczka mnożenia | 7 × 8 | 4 | 4 |
| 11 | 3 | : w zakresie tabliczki | 56 : 7 | 4 | 4 |
| 12 | 3 | wszystkie 4 działania do 100 | mieszanka | 5 | 5 |
| 13 | 4 | + − do 1000 pełnymi setkami i dziesiątkami | 450 + 230 | 5 | 5 |
| 14 | 4 | × : przez 10 i 100, pełnymi dziesiątkami | 30 × 4, 240 : 6 | 5 | 5 |
| 15 | 4 | dwucyfrowa × jednocyfrowa, dzielna do 100 | 14 × 6, 84 : 4 | 5 | 5 |
| 16 | 5 | + − do 1000, dowolne liczby | 367 + 248 | 6 | 5 |
| 17 | 5 | trzycyfrowa : jednocyfrowa | 852 : 6 | 6 | 6 |
| 18 | 6 | × do 20 × 20 | 15 × 12, 17 × 17 | 6 | 6 |
| 19 | 7 | wszystkie działania, większe liczby | mieszanka | 7 | 7 |
| 20 | 8 | „Mistrz”: wszystko, szybko | mieszanka | 8 | 8 |

- co **10 punktów** – następny poziom; po **20. poziomie** gra gratuluje – można grać dalej na 20. poziomie,
- zapisani gracze mają zapamiętany najwyższy osiągnięty poziom; następnym razem gra proponuje start
  od poziomu, na którym skończyli,
- działania „do powtórki” wracają tylko na tym samym albo kilku kolejnych poziomach kampanii.

Poziomy są opisane w `js/campaign.js`.

## Zasady (własne ustawienia)

- zestrzelony statek: **+1 punkt**,
- statek, który wyleci z prawej strony ekranu: **−1 punkt**,
- co **10 punktów** – następna plansza: nowe tło, fajerwerki, trochę trudniejsze działania
  (większe liczby, szybsze i częstsze statki),
- po **5 planszach** gra gratuluje zwycięstwa – można zakończyć albo grać dalej.

## Sterowanie

| Klawisz | Działanie |
|---|---|
| cyfry | wpisywanie wyniku |
| Enter / spacja | strzał |
| Backspace | kasowanie cyfry |
| ← → | ruch ufoludka |
| Esc / P | pauza |
| M | dźwięk wł./wył. |

Na telefonie i tablecie zamiast klawiatury jest klawiatura z cyframi na ekranie (🚀 = strzał).

Gdy kilka statków ma ten sam wynik, zestrzelony zostaje ten, który jest najbliżej prawej krawędzi.

## Gracze

- 🔵 **niebieski** – gość, nic nie jest zapamiętywane,
- 🟢 **zielony**, 🩷 **różowy**, 🔴 **czerwony** – gra zapamiętuje imię (można je zmienić na karcie
  gracza), ostatnie ustawienia, rekord oraz działania, które najczęściej uciekały.
  Takie działania pojawiają się częściej, aż gracz zacznie je trafiać.

Dane są zapisywane w przeglądarce (`localStorage`) na danym komputerze.

## Ustawienia

- **V** – prędkość lotu statków (1–10),
- **R** – częstotliwość pojawiania się statków (1–10),
- rodzaje działań i zakres dla każdego z nich.

Domyślnie:

- dodawanie i odejmowanie w zakresie 100,
- mnożenie liczb od 0 do 10,
- dzielenie bez reszty: dzielna 1–999 (od 1 do 3 cyfr), dzielnik jednocyfrowy (1–9).

Ustawienia dotyczą 1. planszy. Na kolejnych planszach zakresy rosną (dodawanie/odejmowanie
o 25% na planszę, mnożenie o 1, w dzieleniu częściej trafiają się dłuższe dzielne
i nie ma dzielenia przez 1), a statki lecą szybciej i pojawiają się częściej.

## Pliki

- `index.html`, `css/style.css` – strona i ekrany menu,
- `js/game.js` – główna logika gry,
- `js/problems.js` – losowanie działań i utrudnianie na kolejnych planszach (własne ustawienia),
- `js/campaign.js` – 20 poziomów kampanii i losowanie działań dla nich,
- `js/graphics.js` – tła plansz, ufoludek, statki, wybuchy i fajerwerki,
- `js/audio.js` – efekty dźwiękowe (generowane, bez plików),
- `js/storage.js` – gracze, zapis ustawień i trwającej gry,
- `js/pwa.js`, `sw.js`, `manifest.webmanifest` – aplikacja: instalacja, działanie offline, nowe wersje,
- `icons/` – ikony aplikacji; źródło: `tools/icon/ikona.svg`,
- `tools/build-sw.mjs` – przy publikacji wpisuje do `sw.js` wersję i listę plików,
- `.github/workflows/pages.yml` – publikacja na GitHub Pages.
