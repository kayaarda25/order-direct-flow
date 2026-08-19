# Agent-Dokument: Drucker-Agent «Piratino Print & Alarm» (IP-Version)

Dieser Agent ist **kein Browser-Tab**, sondern ein kleines Programm, das im Lokalnetz
der Pizzeria läuft (Mini-PC, Laptop oder Raspberry Pi) und den Bondrucker **direkt über
seine IP-Adresse** anspricht (Rohdruck ESC/POS, TCP Port 9100 – kein Druckdialog,
kein Treiber, keine Bestätigung).

Er fängt jede Bestellung ab, druckt sie sofort und löst einen sehr lauten Dauer-Alarm
aus, der erst stoppt, wenn die Meldung geschlossen wird.

Das Dokument ist als Auftrag/Spezifikation gedacht und kann 1:1 als Entwicklungsvorgabe
verwendet werden.

---

## 1. Aufbau (wie es über die IP läuft)

```text
 Webseite / Bestellung
          |
          v
 forward-order (Cloud)  --->  POS 1   --->  POS 2
          |
          |  HTTPS oder Polling
          v
 +------------------------------------------+
 |  DRUCKER-AGENT (Mini-PC in der Pizzeria) |
 |  - holt/empfängt Bestellungen            |
 |  - Alarmfenster + lauter Dauerton        |
 |  - TCP-Verbindung zu 192.168.1.50:9100   |
 +------------------------------------------+
                     |
                     v
        Bondrucker (feste IP im WLAN/LAN)
```

Wichtig: Der Agent läuft im **gleichen Netz** wie der Drucker. Nur er spricht mit der
Drucker-IP; die Cloud selbst kann und muss den Drucker nicht erreichen.

## 2. Zwei Betriebsarten

**A) Pull (empfohlen, keine Portfreigabe nötig)**

- Der Agent fragt alle 3 Sekunden die Cloud nach neuen Bestellungen
  (Realtime-Abo bevorzugt, Polling als Fallback).
- Funktioniert hinter jedem Router ohne Konfiguration, auch bei wechselnder
  öffentlicher IP.

**B) Push (nur wenn der Standort eine feste öffentliche IP hat)**

- Der Agent stellt lokal einen HTTP-Server bereit:
  `POST http://<öffentliche-IP>:8787/api/print/inbound`
- Router-Portweiterleitung 8787 → Mini-PC nötig, Absicherung über
  `x-webhook-secret: <PRINT_AGENT_SECRET>` und IP-Whitelist.
- `forward-order` erhält diese URL als drittes Ziel.

Beide Betriebsarten dürfen gleichzeitig aktiv sein; Doppelungen werden über die
Bestellnummer (Idempotenz) verhindert.

## 3. Kernverhalten

1. Neue Bestellung erkennen (Push-Eingang oder Polling).
2. Bestellung lokal speichern (SQLite-Datei), damit nichts verloren geht.
3. Sofort auf der Drucker-IP drucken (Abschnitt 5 und 6).
4. Alarmfenster anzeigen: Vollbild, rot blinkend, sehr lauter Dauerton.
5. Alarm läuft weiter, bis das Personal «BESTELLUNG ANNEHMEN» drückt.
6. Nach Bestätigung: Ton stoppt, Fenster schliesst, Status `acknowledged`.
7. Ohne Bestätigung: Alarm bleibt aktiv, Nachdruck nach 60 Sekunden (max. 3 Versuche).
8. Der Alarm wird auch dann ausgelöst, wenn der Druck fehlschlägt.

## 4. Alarm-Meldung (Kernanforderung)

Anzeige:

- Vollbild-Fenster, immer im Vordergrund («always on top»), nicht per Klick daneben,
  ESC, Alt+Tab oder Fenster-X schliessbar.
- Rot blinkender Hintergrund, sehr grosse Schrift.
- Inhalt: Bestellnummer, Typ (LIEFERUNG / ABHOLUNG / GEPLANT + Uhrzeit), Total,
  Anzahl Positionen, Kundenname, Telefon, Adresse.
- Genau ein Button: «BESTELLUNG ANNEHMEN» (gross, unten, Vollbreite).
- Mehrere Bestellungen: Warteschlange mit Zähler «Bestellung 1 von 3».

Ton:

- Datei `alarm.wav` (durchdringende Sirene, 2–3 Sekunden, Endlosschleife).
- Wiedergabe über das Betriebssystem mit **maximaler Systemlautstärke**; der Agent
  setzt die Lautstärke beim Alarmstart selbst auf 100 % (kein Autoplay-Problem,
  da kein Browser).
- Zusätzlich optional Signalton über angeschlossenen Summer/Lautsprecher.
- Läuft der Alarm länger als 5 Minuten: zusätzlich System-Benachrichtigung,
  Ton läuft weiter.

Der Alarm stoppt ausschliesslich über «BESTELLUNG ANNEHMEN». Kein Stummschalter,
kein automatisches Timeout.

## 5. Druck über die IP (ESC/POS, Port 9100)

Ablauf pro Bon:

1. TCP-Socket zu `PRINTER_HOST:PRINTER_PORT` öffnen (Timeout 5 Sekunden).
2. ESC/POS-Bytes senden: Initialisieren `ESC @`, Zentrierung `ESC a 1`,
   Doppelgrösse `GS ! 0x11`, Text (Codepage CP437/CP1252, Umlaute beachten),
   Papierschnitt `GS V 0x00`.
3. Socket schliessen, Erfolg protokollieren.

Beispiel (Node.js, ohne Zusatzbibliothek):

```js
import net from "node:net";

const ESC = "\x1b", GS = "\x1d";
export function printRaw(host, port, text) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host, port, timeout: 5000 }, () => {
      s.write(ESC + "@");                 // Reset
      s.write(text, "binary");            // Bon-Inhalt
      s.write("\n\n\n" + GS + "V" + "\x00"); // Vorschub + Schnitt
      s.end();
    });
    s.on("error", reject);
    s.on("timeout", () => { s.destroy(); reject(new Error("Drucker Timeout")); });
    s.on("close", resolve);
  });
}
```

Drucker-Erkennung:

- Der Drucker braucht eine **feste IP** (DHCP-Reservierung im Router).
- Der Agent prüft alle 30 Sekunden per TCP-Verbindungstest, ob die IP erreichbar ist,
  und zeigt im Terminal «DRUCKER ONLINE / OFFLINE».
- Optionaler Netzwerk-Scan beim Setup: Bereich `192.168.x.1–254`, Port 9100,
  zur Anzeige gefundener Drucker.

Alternativen, falls der Drucker kein 9100 anbietet:

1. Epson ePOS-Print: `POST http://<drucker-ip>/cgi-bin/epos/service.cgi`
2. Star WebPRNT: `POST http://<drucker-ip>/StarWebPRNT/SendMessage`

## 6. Bon-Layout (80 mm Thermodrucker)

```text
      PIZZA PIRATINO
   Badenerstrasse 696, 8048 Zürich
        +41 44 431 32 33
--------------------------------
BESTELLUNG  #WEB-1234
19.08.2026  11:42
TYP: LIEFERUNG
ZEIT: sofort / geplant 18:45
ZAHLUNG: BARGELD
--------------------------------
KUNDE: Max Muster
TEL:   +41 79 123 45 67
ADR:   Musterstrasse 12
       8048 Zürich
--------------------------------
2x MARGHERITA            37.00
   + Extra Käse
   + Ohne Basilikum
   ! gut gebacken
1x COLA 0.5L              4.50
--------------------------------
Zwischensumme            41.50
Lieferung                 5.00
TOTAL CHF                46.50
--------------------------------
BEMERKUNG: Bitte klingeln
--------------------------------
```

- Artikelnamen in GROSSBUCHSTABEN, Menge und Artikelname in Doppelgrösse.
- Modifikatoren mit `+`, Artikel-Notizen mit `!` eingerückt darunter.
- Bei Stationsbetrieb: je Station ein eigener Bon (`pizza`, `kitchen`, `drinks`),
  plus Gesamtbon für die Theke. Stationen dürfen unterschiedliche Drucker-IPs haben.

## 7. Nutzlast (identisch zum POS-1-Format)

```json
{
  "customer_name": "Max Muster",
  "customer_phone": "+41 79 123 45 67",
  "customer_address": "Musterstrasse 12, 8048 Zürich",
  "order_type": "delivery",
  "payment_type": "cash",
  "scheduled_time": "18:45",
  "special_notes": "Bitte klingeln",
  "items": [
    {
      "name": "MARGHERITA",
      "quantity": 2,
      "price": 18.5,
      "station": "pizza",
      "modifiers": "Extra Käse, Ohne Basilikum",
      "notes": "gut gebacken"
    }
  ]
}
```

Regeln:

- Antwort `200 { "success": true, "order_number": "..." }` erst, wenn die Bestellung
  lokal gespeichert ist; der Druck darf danach asynchron erfolgen.
- Fehlerhafte Nutzlast: `400` mit klarer Meldung, niemals still verwerfen.
- Doppelte Zustellung wird über Bestellnummer bzw. Hash aus Kunde + Zeit + Positionen
  erkannt und nicht doppelt gedruckt.

## 8. Technik-Vorgabe

- Laufzeit: Node.js 20 als Desktop-Anwendung (Electron oder Tauri) für Fenster,
  Ton und «always on top»; alternativ Kiosk-Betrieb mit lokalem Node-Dienst.
- Autostart beim Einschalten des Geräts, Ruhezustand/Bildschirmschoner deaktiviert.
- Lokale Datenbank: SQLite-Datei `orders.db` (Tabelle siehe Abschnitt 9).
- Watchdog: stürzt der Agent ab, startet er automatisch neu und druckt alle
  unbestätigten Bestellungen nach.
- Protokoll: `agent.log` mit Zeitstempel je Bestellung, Druckversuch und Fehler.

## 9. Datenhaltung (lokal)

| Feld | Bedeutung |
| --- | --- |
| `id` | Primärschlüssel |
| `order_number` | Bestellnummer, eindeutig |
| `payload` | vollständige Nutzlast (JSON) |
| `order_type` | `delivery` / `pickup` |
| `scheduled_time` | geplanter Zeitpunkt oder leer |
| `total` | Gesamtbetrag |
| `printed_at` | Zeitpunkt des erfolgreichen Drucks |
| `print_attempts` | Anzahl Druckversuche |
| `acknowledged_at` | Zeitpunkt der Bestätigung (Alarm gestoppt) |
| `created_at` | Eingang |

## 10. Konfiguration (`config.json` bzw. `.env`)

| Schlüssel | Beispiel | Zweck |
| --- | --- | --- |
| `PRINTER_HOST` | `192.168.1.50` | feste IP des Bondruckers |
| `PRINTER_PORT` | `9100` | Rohdruck-Port |
| `PRINTER_HOST_PIZZA` | `192.168.1.51` | optional zweiter Drucker (Station) |
| `MODE` | `pull` / `push` / `both` | Betriebsart nach Abschnitt 2 |
| `LISTEN_PORT` | `8787` | Port des lokalen Empfangs-Servers (Push) |
| `PRINT_AGENT_SECRET` | – | Secret für den Empfangs-Endpunkt |
| `POLL_SECONDS` | `3` | Abfrageintervall (Pull) |
| `ALARM_REPRINT_SECONDS` | `60` | Wiederholdruck-Intervall |
| `STATION_SPLIT` | `true` | Bons pro Station drucken |

## 11. Terminal-Oberfläche

- Kopfzeile: Verbindungsstatus Cloud, Drucker-IP mit Online/Offline, Uhrzeit.
- Liste offener Bestellungen mit Zeitstempel, Typ, Total, Button «Nochmals drucken».
- Buttons «Testalarm», «Testdruck» und «Drucker suchen» für die Inbetriebnahme.
- Archiv der letzten 7 Tage, Suche nach Bestellnummer oder Telefonnummer.
- Optik: dunkles Küchen-Layout, sehr grosse Schrift, mit fettigen Fingern bedienbar,
  keine Emojis.

## 12. Fehlerfälle

- Drucker-IP nicht erreichbar: Bestellung bleibt in der Druck-Warteschlange, neuer
  Versuch alle 30 Sekunden, Warnstreifen «DRUCKER OFFLINE» im Terminal, Alarm trotzdem.
- Internet weg: Push-Bestellungen kommen nicht an, Pull holt beim Wiederaufbau alles
  Verpasste nach; nichts wird übersprungen.
- Papier leer: Druck schlägt fehl → Warteschlange bleibt, Meldung «PAPIER PRÜFEN».
- Falsche IP konfiguriert: Sofortmeldung beim Start mit Hinweis auf «Drucker suchen».

## 13. Abnahmekriterien

1. Testbestellung über die Webseite: Bon wird innerhalb von 5 Sekunden auf der
   konfigurierten Drucker-IP gedruckt, ohne jeden Druckdialog.
2. Gleichzeitig erscheint das Vollbild-Alarmfenster, der Ton läuft in Dauerschleife.
3. Der Ton lässt sich weder durch Klick daneben, ESC, Alt+Tab noch Fenster-X stoppen.
4. Nach Klick auf «BESTELLUNG ANNEHMEN» stoppt der Ton sofort, Fenster schliesst.
5. Drei Bestellungen in Folge: alle drei gedruckt, einzeln bestätigt.
6. Drucker-Netzkabel gezogen: Alarm läuft trotzdem, Bon wird nach Wiederanschluss
   automatisch gedruckt.
7. Agent-Neustart: unbestätigte Bestellungen lösen den Alarm erneut aus.
8. Gerät neu eingeschaltet: Agent startet von selbst und ist ohne Bedienung bereit.
