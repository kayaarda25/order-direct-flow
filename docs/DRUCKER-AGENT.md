# Agent-Dokument: Drucker-Agent «Piratino Print & Alarm v3»

Vorlage ist der bestehende **Piratino Print-Agent v2** (`agent.cjs` + `start.bat`,
Node.js, Fastify, HTTP auf Port **9110**, Rohdruck über Windows-Druckername,
ESC/POS inkl. Logo und nativem QR-Code).

Dieses Dokument beschreibt die Erweiterung zu **v3**: gleicher Aufbau, gleicher Port,
aber der Agent nimmt Bestellungen direkt entgegen, druckt sie automatisch und löst
dabei eine Meldung mit **sehr lautem Dauer-Alarmton** aus, der erst stoppt, wenn die
Meldung geschlossen wird.

Das Dokument kann 1:1 als Entwicklungsvorgabe für den Agenten verwendet werden.

---

## 1. Aufbau (läuft über die IP)

```text
 Webseite / Bestellung
          |
          v
 forward-order (Cloud)  --->  POS 1   --->  POS 2
          |
          |  HTTP an http://<PC-IP>:9110/order
          v
 +--------------------------------------------------+
 |  PRINT-AGENT v3 (Windows-PC in der Pizzeria)     |
 |  Node.js, Fastify, Port 9110                     |
 |  - /order nimmt Bestellung an                    |
 |  - druckt Bon (ESC/POS, Logo, QR)                |
 |  - Alarmfenster + lauter Dauerton                |
 +--------------------------------------------------+
                     |
      Windows-Rohdruck bzw. TCP 9100
                     v
              Bondrucker im Netz
```

Der Agent ist über die **IP des Windows-PCs** erreichbar (`http://192.168.x.x:9110`),
genau wie heute schon bei v2. Der Drucker wird entweder wie bisher über den
Windows-Druckernamen angesprochen oder direkt über die Drucker-IP (TCP 9100),
siehe Abschnitt 6.

## 2. Bestehende Endpunkte (unverändert aus v2 übernehmen)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/health` | Version + gefundene Drucker |
| GET | `/printers` | Liste der Windows-Drucker |
| POST | `/discover` | Netzwerk-Suche nach Druckern |
| POST | `/test` | Testdruck inkl. QR-Code |
| POST | `/print` | freier Bon-Druck (`{ printer, payload }`) |

CORS bleibt offen (`origin: true`), der Agent ist nur im Lokalnetz erreichbar.

## 3. Neue Endpunkte in v3

```text
POST /order            Bestellung annehmen -> speichern, drucken, Alarm starten
Header: x-agent-secret: <PRINT_AGENT_SECRET>

GET  /orders           offene, unbestätigte Bestellungen
POST /orders/:id/ack   Bestellung bestätigen -> Alarm stoppt
POST /orders/:id/reprint   Bon erneut drucken
POST /alarm/test       Testalarm (Ton + Fenster)
```

Nutzlast von `/order` (identisch zum POS-1-Format):

```json
{
  "order_number": "WEB-1234",
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

- Antwort `200 { "ok": true, "order_number": "..." }` sobald die Bestellung
  **gespeichert** ist; Druck und Alarm laufen danach asynchron weiter.
- Fehlerhafte Nutzlast: `400 { "ok": false, "error": "..." }`, niemals still verwerfen.
- Falsches oder fehlendes Secret: `401`.
- Doppelte Zustellung wird über `order_number` (bzw. Hash aus Kunde + Zeit + Positionen)
  erkannt und nicht doppelt gedruckt.
- Der Alarm wird auch dann ausgelöst, wenn der Druck fehlschlägt.

## 4. Betriebsarten

**A) Push (wie v2, empfohlen im Lokalnetz)**
`forward-order` bzw. das POS schickt die Bestellung an `http://<PC-IP>:9110/order`.
Für Zugriff von aussen: Portweiterleitung 9110 auf den PC + `PRINT_AGENT_SECRET`
+ IP-Whitelist.

**B) Pull (ohne Portfreigabe)**
Der Agent fragt alle 3 Sekunden die Cloud nach neuen Bestellungen. Damit funktioniert
er hinter jedem Router, auch bei wechselnder öffentlicher IP.

Beide Arten dürfen gleichzeitig laufen; Doppelungen verhindert die Idempotenz-Regel.

## 5. Alarm-Meldung (Kernanforderung)

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
- Wiedergabe über das Betriebssystem, Systemlautstärke wird beim Alarmstart
  auf 100 % gesetzt. Kein Browser-Autoplay-Problem, da eigenständiges Programm.
- Läuft der Alarm über 5 Minuten: zusätzlich Windows-Benachrichtigung, Ton läuft weiter.

Der Alarm stoppt ausschliesslich über «BESTELLUNG ANNEHMEN» bzw. `POST /orders/:id/ack`.
Kein Stummschalter, kein automatisches Timeout. Ohne Bestätigung wird der Bon nach
60 Sekunden erneut gedruckt (max. 3 Versuche).

Umsetzung des Fensters: Electron- oder Tauri-Hülle um den bestehenden Fastify-Agenten,
alternativ ein lokales Vollbildfenster, das der Agent selbst öffnet. `start.bat` bleibt
als Startweg erhalten.

## 6. Druck-Technik

1. **Wie v2 (Standard):** Windows-Rohdruck über den Druckernamen (PowerShell
   `SendBytesToPrinter`), ESC/POS-Bytes inkl. Logo-Bitmap und nativem QR-Code.
2. **Direkt über die Drucker-IP:** TCP-Socket zu `PRINTER_HOST:9100`, gleiche
   ESC/POS-Bytes, Timeout 5 Sekunden – nötig, wenn der Drucker nicht als
   Windows-Drucker installiert ist.

```js
import net from "node:net";
const ESC = "\x1b", GS = "\x1d";
export function printRaw(host, port, bytes) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host, port, timeout: 5000 }, () => {
      s.write(ESC + "@");
      s.write(bytes);
      s.write("\n\n\n" + GS + "V" + "\x00"); // Vorschub + Schnitt
      s.end();
    });
    s.on("error", reject);
    s.on("timeout", () => { s.destroy(); reject(new Error("Drucker Timeout")); });
    s.on("close", resolve);
  });
}
```

- Alle 30 Sekunden Erreichbarkeitsprüfung, Statusanzeige «DRUCKER ONLINE / OFFLINE».
- `POST /discover` scannt `192.168.x.1–254` auf Port 9100 und listet gefundene Drucker.

## 7. Bon-Layout (80 mm Thermodrucker)

```text
        [PIRATINO-LOGO]
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
        [QR-CODE Kurier]
--------------------------------
```

- Artikelnamen in GROSSBUCHSTABEN, Menge und Artikelname in Doppelgrösse.
- Modifikatoren mit `+`, Artikel-Notizen mit `!` eingerückt darunter.
- QR-Code wie in v2 als nativer ESC/POS-QR (kein Bild), z. B. Kurier-Link.
- Bei Stationsbetrieb: je Station ein eigener Bon (`pizza`, `kitchen`, `drinks`) plus
  Gesamtbon für die Theke; Stationen dürfen unterschiedliche Drucker haben.
- Am Schluss Papierschnitt (`GS V 0`).

## 8. Technik-Vorgaben

- Node.js 20, Fastify, ein gebündeltes `agent.cjs` wie bisher, Start über `start.bat`.
- Autostart mit Windows (Verknüpfung in `shell:startup`), Energiesparmodus und
  Bildschirmschoner deaktiviert.
- Lokale Speicherung: `orders.json` bzw. SQLite `orders.db` (Felder siehe Abschnitt 9).
- Watchdog/Neustart: nach Absturz oder PC-Neustart werden alle unbestätigten
  Bestellungen nachgedruckt und der Alarm erneut ausgelöst.
- Protokoll `agent.log`: Zeitstempel je Bestellung, Druckversuch und Fehler.

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

## 10. Konfiguration (`config.json` bzw. Umgebungsvariablen)

| Schlüssel | Beispiel | Zweck |
| --- | --- | --- |
| `PORT` | `9110` | Port des Agenten (wie v2) |
| `HOST` | `0.0.0.0` | im Lokalnetz erreichbar |
| `PRINTER_NAME` | `EPSON TM-T20III` | Windows-Drucker (Standardweg) |
| `PRINTER_HOST` | `192.168.1.50` | optional: Drucker direkt über IP |
| `PRINTER_PORT` | `9100` | Rohdruck-Port |
| `PRINT_AGENT_SECRET` | – | Secret für `/order` |
| `MODE` | `push` / `pull` / `both` | Betriebsart nach Abschnitt 4 |
| `POLL_SECONDS` | `3` | Abfrageintervall (Pull) |
| `ALARM_REPRINT_SECONDS` | `60` | Wiederholdruck-Intervall |
| `STATION_SPLIT` | `true` | Bons pro Station |

## 11. Bedienoberfläche des Agenten

- Kopfzeile: Port und IP des Agenten, Drucker-Status, Uhrzeit.
- Liste offener Bestellungen mit Zeitstempel, Typ, Total, Button «Nochmals drucken».
- Buttons «Testalarm», «Testdruck» (inkl. QR) und «Drucker suchen».
- Archiv der letzten 7 Tage, Suche nach Bestellnummer oder Telefonnummer.
- Optik: dunkles Küchen-Layout, sehr grosse Schrift, keine Emojis.

## 12. Fehlerfälle

- Drucker offline: Bestellung bleibt in der Warteschlange, neuer Versuch alle
  30 Sekunden, Warnstreifen «DRUCKER OFFLINE», Alarm läuft trotzdem.
- Papier leer: Meldung «PAPIER PRÜFEN», Bon bleibt in der Warteschlange.
- Netzwerk/Internet weg: Push-Bestellungen kommen nicht an, Pull holt beim
  Wiederaufbau alles Verpasste nach.
- Falscher Druckername oder falsche IP: Sofortmeldung beim Start mit Hinweis auf
  «Drucker suchen».

## 13. Abnahmekriterien

1. `start.bat` gestartet: `GET http://<PC-IP>:9110/health` liefert Version und Drucker.
2. Testbestellung über die Webseite: Bon inkl. Logo und QR wird innerhalb von
   5 Sekunden gedruckt, ohne Druckdialog.
3. Gleichzeitig erscheint das Vollbild-Alarmfenster, der Ton läuft in Dauerschleife.
4. Der Ton lässt sich weder durch Klick daneben, ESC, Alt+Tab noch Fenster-X stoppen.
5. Nach Klick auf «BESTELLUNG ANNEHMEN» stoppt der Ton sofort, das Fenster schliesst.
6. Drei Bestellungen in Folge: alle drei gedruckt, einzeln bestätigt.
7. Drucker ausgesteckt: Alarm läuft trotzdem, Bon wird nach Wiederanschluss gedruckt.
8. PC neu gestartet: Agent startet von selbst, unbestätigte Bestellungen alarmieren erneut.
