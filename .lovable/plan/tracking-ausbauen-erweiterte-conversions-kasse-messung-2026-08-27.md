# Tracking ausbauen: Erweiterte Conversions + Kasse-Messung

Der Grund-Versand an Google läuft bereits (Kauf-Conversion mit echtem Bestellwert). Zwei Ergänzungen:

## 1. Erweiterte Conversions (bessere Zuordnung)

Wenn ein eingeloggter Kunde bestellt, wird seine E-Mail-Adresse verschlüsselt (gehasht durch Google's Tag) mit der Bestellung mitgesendet. Google kann so Bestellungen einem Anzeigenklick zuordnen, auch wenn Cookies fehlen — typischerweise deutlich mehr erfasste Conversions.

- Gesendet wird nur die E-Mail, keine weiteren persönlichen Daten.
- Nur wenn der Besucher im Cookie-Banner zugestimmt hat (bzw. in Regionen ohne Banner).
- Gäste ohne Konto: nichts ändert sich, es wird nur der Bestellwert gemeldet.

Damit es zählt, musst du in Google Ads einmal die Kundendaten-Bedingungen akzeptieren und "Erweiterte Conversions" in den Conversion-Einstellungen aktivieren. Bis dahin ignoriert Google die Daten — der Code schadet nicht.

## 2. Zweite Messung: Kasse gestartet

Neue Conversion "Kasse gestartet" (nur Beobachtung, steuert das Bidding nicht). Sie meldet, wenn ein Besucher die Kassenseite mit gefülltem Warenkorb öffnet. Damit siehst du in Google Ads, wie viele Anzeigenklicks bis zur Kasse kommen und wo Bestellungen abbrechen.

## 3. Datenschutzerklärung

Die Seite hat aktuell keine Datenschutzseite. Da E-Mail-Daten an Google gehen, ist eine Offenlegung Pflicht: neue Seite `/datenschutz` mit den nötigen Angaben (Betreiber, Bestelldaten, Cookies/Google Ads, Weitergabe der E-Mail zur Werbemessung, Rechte) plus Link im Footer.

## 4. Kleine Korrektur

Die Kauf-Conversion wird momentan an zwei Stellen ausgelöst (beim Absenden und auf der Bestätigungsseite). Google entdoppelt über die Bestellnummer, aber ich reduziere es auf einen klaren Auslöser, damit die Zahlen eindeutig bleiben.

## Technische Details

- Neue Conversion-Aktion `BEGIN_CHECKOUT`, bidding = secondary; ihr `send_to` kommt in `src/lib/googleAdsTracking.ts`.
- `hasAdConsent()` aus `src/components/ConsentBanner.tsx` exportieren/nutzen und `gtag("set", "user_data", { email })` vor dem Conversion-Event setzen.
- E-Mail-Quelle: `supabase.auth.getUser()` (eingeloggter Kunde). Kein Hashing im App-Code nötig — das Tag hasht selbst.
- Kasse-Event in `src/pages/CheckoutPage.tsx` beim ersten Render mit Artikeln, einmalig pro Sitzung.
- Purchase-Event nur noch in `OrderConfirmationPage.tsx` (Aufruf in `CheckoutPage` entfernen).
- Neue Route `/datenschutz` in `src/App.tsx`, Seite im bestehenden dunklen Design, Footer-Link.
- Nach dem Umbau muss veröffentlicht werden, damit die Änderungen live messen.
