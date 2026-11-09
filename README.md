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

## Zasady

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
- `js/problems.js` – losowanie działań i utrudnianie na kolejnych planszach,
- `js/graphics.js` – tła plansz, ufoludek, statki, wybuchy i fajerwerki,
- `js/audio.js` – efekty dźwiękowe (generowane, bez plików),
- `js/storage.js` – gracze, zapis ustawień i trwającej gry,
- `js/pwa.js`, `sw.js`, `manifest.webmanifest` – aplikacja: instalacja, działanie offline, nowe wersje,
- `icons/` – ikony aplikacji; źródło: `tools/icon/ikona.svg`,
- `tools/build-sw.mjs` – przy publikacji wpisuje do `sw.js` wersję i listę plików,
- `.github/workflows/pages.yml` – publikacja na GitHub Pages.
