# Agent-Dokument: Drucker-Agent «Piratino Print & Alarm»

Dieses Dokument beschreibt vollständig den Agenten, der alle eingehenden Bestellungen
abfängt, automatisch ausdruckt und dabei eine Meldung mit sehr lautem Dauer-Alarmton
anzeigt, der erst stoppt, wenn die Meldung geschlossen (bestätigt) wird.

Das Dokument ist als Auftrag/Spezifikation gedacht: es kann 1:1 als Prompt oder
Entwicklungsvorgabe für die Umsetzung des Drucker-Agenten verwendet werden.

---

## 1. Zweck

- Jede Bestellung von piratino-pizzeria.ch (Lieferung, Abholung, geplante Bestellung)
  wird sofort erkannt.
- Bestellung wird ohne manuellen Klick auf dem Küchen-/Theken-Drucker ausgedruckt.
- Personal wird akustisch und visuell alarmiert, bis die Bestellung bestätigt wird.
- Keine Bestellung darf verloren gehen: Drucker offline oder Personal abwesend
  bedeutet Wiederholung, nicht Verlust.

## 2. Rolle und Verhalten des Agenten

Rolle: «Küchen-Terminal». Der Agent läuft dauerhaft auf einem Gerät in der Pizzeria
(Tablet, iPad, Laptop oder Mini-PC) im Vollbildmodus, immer eingeschaltet, Bildschirm
darf nicht schlafen.

Kernverhalten:

1. Neue Bestellung erkennen (Realtime-Abo, Fallback: Polling alle 10 Sekunden).
2. Bestellung sofort drucken (Bon-Layout, siehe Abschnitt 5).
3. Alarm-Meldung anzeigen (Vollbild-Overlay) + sehr lauter Alarmton in Dauerschleife.
4. Alarm läuft weiter, bis das Personal «Bestellung annehmen» drückt.
5. Nach Bestätigung: Ton stoppt, Overlay schliesst, Bestellung erscheint in der
   offenen Bestellliste, Status wird auf `acknowledged` gesetzt.
6. Wenn nicht bestätigt: Alarm bleibt aktiv, Bestellung wird nach 60 Sekunden erneut
   gedruckt (max. 3 Versuche), damit sie nie unbemerkt bleibt.

## 3. Alarm-Meldung (Kernanforderung)

Anzeige:

- Vollbild-Overlay, kann nicht per Klick daneben, ESC oder Zurück-Taste geschlossen werden.
- Rot blinkender Hintergrund, sehr grosse Schrift.
- Inhalt: Bestellnummer, Typ (LIEFERUNG / ABHOLUNG / GEPLANT + Uhrzeit), Total,
  Anzahl Positionen, Kundenname, Telefon, Adresse.
- Genau ein Button: «BESTELLUNG ANNEHMEN» (gross, unten, Vollbreite).
- Mehrere Bestellungen gleichzeitig: Warteschlange, eine nach der anderen; Zähler
  «Bestellung 1 von 3» wird angezeigt.

Ton:

- Datei: `alarm.mp3` (durchdringender Sirenen-/Glocken-Ton, 2–3 Sekunden, geloopt).
- `loop = true`, `volume = 1.0`, Wiedergabe in Endlosschleife bis Bestätigung.
- Zusätzlich Vibration auf Mobilgeräten: `navigator.vibrate([600, 300])` wiederholt.
- Lautstärke-Absicherung: Ton startet auch dann, wenn der Tab im Hintergrund ist.
- Browser-Autoplay-Sperre: Beim Start des Terminals einmalig Button
  «Terminal aktivieren» anzeigen; dieser Klick entsperrt Audio (AudioContext resume)
  für die gesamte Sitzung. Zusätzlich ein Web-Audio-Oszillator-Fallback, falls die
  MP3-Wiedergabe blockiert wird.
- Sicherheitsnetz: Läuft der Alarm länger als 5 Minuten, wird zusätzlich eine
  Browser-Benachrichtigung ausgelöst (Notification API), Ton läuft weiter.

Stoppen des Alarms erfolgt ausschliesslich über den Button «BESTELLUNG ANNEHMEN».
Es gibt keinen Stummschalt-Knopf und kein automatisches Timeout.

## 4. Datenquelle / Schnittstelle

Der Agent bekommt Bestellungen über den bestehenden Weiterleitungsweg.
Bestellungen werden von `supabase/functions/forward-order` an die Kassensysteme
geschickt; der Drucker-Agent ist ein weiteres Ziel.

Empfangs-Endpunkt des Agenten (vom Agenten bereitzustellen):

```
POST /api/print/inbound
Header: x-webhook-secret: <PRINT_AGENT_SECRET>
Content-Type: application/json
```

Erwartete Nutzlast (identisch zum POS-1-Format):

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

- Antwort `200 { "success": true, "order_number": "..." }` nur, wenn die Bestellung
  gespeichert wurde. Der Druck darf danach asynchron erfolgen.
- Fehlerhafte Nutzlast: `400` mit klarer Fehlermeldung; niemals still verwerfen.
- Doppelte Zustellungen werden über eine Idempotenz-Kennung (Bestellnummer bzw.
  Hash aus Kunde + Zeit + Positionen) erkannt und nicht doppelt gedruckt.
- Der Alarm muss auch dann ausgelöst werden, wenn der Druck fehlschlägt.

## 5. Bon-Layout (80 mm Thermodrucker)

```
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

- Artikelnamen in GROSSBUCHSTABEN, Doppelgrösse für Menge und Artikelname.
- Modifikatoren mit `+`, Artikel-Notizen mit `!` eingerückt darunter.
- Wenn Stationen genutzt werden: pro Station ein eigener Bon (`pizza`, `kitchen`,
  `drinks`), plus ein Gesamtbon für die Theke.
- Am Schluss Papierschnitt-Befehl senden.

## 6. Druck-Technik

Reihenfolge der Umsetzung:

1. Netzwerkdrucker über ESC/POS (TCP Port 9100) – bevorzugt, druckt ohne Dialog.
2. Star WebPRNT oder Epson ePOS-Print (HTTP an die Drucker-IP) für WLAN-Bondrucker.
3. Fallback: stiller Browser-Druck über verstecktes iframe und `window.print()`
   mit vorbereitetem 80-mm-CSS.

Fehlerfälle:

- Drucker nicht erreichbar: Bestellung in Druck-Warteschlange behalten, alle
  30 Sekunden erneut versuchen, Warnstreifen «DRUCKER OFFLINE» im Terminal anzeigen.
- Beim Wiederanlauf des Terminals werden alle unbestätigten und nicht gedruckten
  Bestellungen automatisch nachgedruckt.

## 7. Terminal-Oberfläche

- Kopfzeile: Verbindungsstatus (Online/Offline), Drucker-Status, Uhrzeit.
- Liste offener Bestellungen mit Zeitstempel, Typ, Total, Button «Nochmals drucken».
- Button «Testalarm» und «Testdruck» für die Inbetriebnahme.
- Archiv der letzten 7 Tage mit Suche nach Bestellnummer oder Telefonnummer.
- Optik: dunkles Küchen-Layout, sehr grosse Schrift, bedienbar mit fettigen Fingern,
  keine Emojis.

## 8. Datenhaltung

Tabelle `print_orders`:

| Feld | Bedeutung |
| --- | --- |
| `id` | Primärschlüssel |
| `order_number` | Bestellnummer, eindeutig |
| `payload` | vollständige eingegangene Nutzlast (JSON) |
| `order_type` | `delivery` / `pickup` |
| `scheduled_time` | geplanter Zeitpunkt oder leer |
| `total` | Gesamtbetrag |
| `printed_at` | Zeitpunkt des erfolgreichen Drucks |
| `print_attempts` | Anzahl Druckversuche |
| `acknowledged_at` | Zeitpunkt der Bestätigung (Alarm gestoppt) |
| `created_at` | Eingang |

Zugriff: nur angemeldetes Personal darf lesen/bestätigen; der Empfangs-Endpunkt
schreibt mit Service-Rechten und prüft das Webhook-Secret.

## 9. Konfiguration

| Schlüssel | Zweck |
| --- | --- |
| `PRINT_AGENT_SECRET` | Secret für den Empfangs-Endpunkt |
| `PRINTER_HOST` | IP des Bondruckers |
| `PRINTER_PORT` | Standard 9100 |
| `ALARM_REPRINT_SECONDS` | Wiederholdruck-Intervall, Standard 60 |
| `STATION_SPLIT` | Bons pro Station drucken: ja/nein |

## 10. Abnahmekriterien

1. Testbestellung über die Webseite: Bon wird innerhalb von 5 Sekunden gedruckt.
2. Gleichzeitig erscheint das Vollbild-Overlay und der Alarmton läuft in Dauerschleife.
3. Ton lässt sich weder durch Klick daneben, ESC noch Zurück-Taste stoppen.
4. Nach Klick auf «BESTELLUNG ANNEHMEN» stoppt der Ton sofort, Overlay schliesst.
5. Bei drei Bestellungen in Folge werden alle drei gedruckt und einzeln bestätigt.
6. Drucker ausgesteckt: Alarm läuft trotzdem, Bestellung wird nach Wiederanschluss
   automatisch gedruckt.
7. Terminal neu geladen: unbestätigte Bestellungen lösen den Alarm wieder aus.
