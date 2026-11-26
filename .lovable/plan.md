# Firmenbestellsystem für piratino-pizzeria.ch

Das bestehende Bestellsystem für Privatkunden bleibt unverändert. Alles Neue kommt als eigener Bereich dazu und nutzt die vorhandene Speisekarte, den Drucker und die Kasse.

## Umsetzung in 4 Etappen (jede einzeln testbar)

**Etappe 1 – Firmenkunden im Admin**
- Neuer Menüpunkt «Firmenkunden»: Firmenname, Rechnungs- und Lieferadresse, Kontaktperson, E-Mail, Liefertage, Lieferzeit, Bestellschluss, Mindestbestellmenge, Rabatt in Prozent oder Sonderpreise pro Produkt, Auswahl der erlaubten Produkte, Zahlungsfrist (Standard 14 Tage), E-Mail für Rechnungen.
- Jede Firma bekommt einen eigenen Link (z. B. /firma/rubi) und einen geheimen Admin-Link für den Firmenadministrator.
- Einstellungen: Freigabe manuell oder automatisch und «Auch unter Mindestmenge automatisch freigeben» (nur durch Piratino einstellbar).

**Etappe 2 – Mitarbeiter bestellen**
- /firma/rubi: Namen eingeben, nächsten Liefertag sehen, Countdown bis Bestellschluss, Speisekarte mit Firmenpreisen, bestellen ohne Login, ohne Adresse und ohne Bezahlung.
- Bestätigung mit persönlichem Link, über den man bis zum Bestellschluss ändern oder stornieren kann.
- Die Website merkt sich den Namen und auf Wunsch die letzte Bestellung («Nochmals bestellen»).
- Nach Bestellschluss sind Änderungen gesperrt, auch technisch auf dem Server.

**Etappe 3 – Firmenadministrator und Übermittlung**
- Geheimer Admin-Link mit Passwort: alle Bestellungen des Tages, Namen, Produkte, Beträge, Anzahl, Gesamtbetrag, Lieferzeit, Countdown, Warnung bei zu wenig Bestellungen.
- Bestellungen bearbeiten, löschen oder hinzufügen; Freigabe mit einem Klick; Umschalter manuell oder automatisch.
- Automatische Freigabe beim Bestellschluss: läuft alle 5 Minuten (288 Durchläufe pro Tag, sehr wenig Last).
- Nach der Freigabe: eine Sammelbestellung an Kasse und Drucker, gekennzeichnet als FIRMENBESTELLUNG, Zahlungsart Monatsrechnung, jedes Gericht mit Mitarbeitername. Der Küchenbon zeigt Firmenname und Mitarbeiternamen pro Gericht.

**Etappe 4 – Monatsrechnungen**
- Am 1. des Monats wird pro Firma automatisch eine PDF-Rechnung erstellt: Firmendaten, Rechnungsnummer, Datum, Lieferdaten, Produkte, Mengen, Preise, MwSt 2,6 %, Total, Zahlungsfrist, Schweizer QR-Einzahlungsschein.
- Die Rechnung geht per E-Mail an die Firma. Dafür muss der E-Mail-Versand von deiner Domain eingerichtet werden; das passiert über ein Fenster, in dem du zustimmst.
- Admin «Rechnungen»: ansehen, herunterladen, Status offen, bezahlt oder storniert setzen, manuell erstellen und versenden.

**Öffentliche Seite «Firmenbestellungen»**
- Infos zum Firmen-Lieferservice, Anfrageformular (geht an Mail, Drucker und Kasse wie Catering), Feld «Firmenlink öffnen» für bestehende Kunden. Link im Menü und im Footer.

## Was ich von dir brauche
- Bankdaten für den QR-Einzahlungsschein (IBAN oder QR-IBAN, Kontoinhaber, Adresse) und deine MwSt-Nummer. Ohne diese Angaben baue ich Etappe 1 bis 3 fertig und lasse die Rechnungen als Entwurf.

## Technische Details
- Neue Tabellen: corporate_clients, corporate_orders (pro Mitarbeiter, mit edit_token), corporate_batches (pro Firma und Liefertag, Status open, released oder sent), corporate_invoices. RLS: nur Piratino-Admins direkt; Mitarbeiter und Firmenadmins gehen über Edge-Funktionen mit Token. Preise und Bestellschluss werden auf dem Server geprüft.
- Edge-Funktionen: corporate-public (Menü, Bestellen, Ändern, Stornieren), corporate-admin (Firmenadmin), corporate-release (Freigabe an forward-order und print_jobs, von pg_cron alle 5 Minuten aufgerufen), corporate-invoice (PDF mit pdf-lib und Swiss QR Bill, Versand über Lovable E-Mail).
- Zeitzone Europe/Zurich für Liefertage und Bestellschluss.
- Der Print-Agent braucht für Mitarbeiternamen keine neue Version: die Namen kommen als Artikel-Bemerkung mit.
- Tests für die Regeln: kein Bestellen oder Ändern nach Bestellschluss, keine automatische Freigabe unter Mindestmenge, Firmenpreise und Rabatte, Zahlungsfrist.
