# MathSpace

Kosmiczna gra do nauki działań matematycznych: dodawania, odejmowania, mnożenia i dzielenia.

Statki kosmiczne z działaniami (np. `12 + 98`, `80 : 4`) lecą z lewej do prawej.
Gracz steruje ufoludkiem: wpisuje wynik i naciska **Enter** – ufoludek strzela i statek wybucha.

## Jak uruchomić

Wystarczy otworzyć plik `index.html` w przeglądarce (Chrome, Edge, Firefox).
Nie trzeba niczego instalować.

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
- `js/storage.js` – gracze i zapis ustawień.
