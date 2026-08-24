# Höher bei Google erscheinen (lokale Suche Zürich)

Ziel: mehr Sichtbarkeit für Suchen wie "Pizza Lieferung Zürich Altstetten", "Pizza bestellen 8048", "Pizzeria Badenerstrasse" – und mehr Bestellungen direkt über die eigene Seite statt über UberEats, Smood oder Just Eat.

## Wichtigster Punkt (ausserhalb der Website)

Im Screenshot zeigt Google beim Punkt "Online bestellen" nur UberEats, Smood und Just Eat. Im Google-Unternehmensprofil kann piratino-pizzeria.ch als eigener Bestell-Link eingetragen werden ("Bestell-Links" / "Essen bestellen"). Das bringt sofort Klicks und spart Provisionen. Diesen Schritt muss Piratino selbst im Google-Unternehmensprofil machen – ich schreibe eine kurze Klick-Anleitung dazu in den Chat.

## Was ich auf der Website baue

1. **Neue Seite "Pizza Lieferung Zürich"** (`/pizza-lieferung-zuerich`)
   - Echte Liefergebiete und Postleitzahlen aus der Datenbank (inkl. 8048 Altstetten, Mindestbestellwert CHF 20).
   - Lieferzeiten, Liefergebühren, Zahlungsarten (Bar, Karte, TWINT).
   - Direkter Bestell-Button ins Menü.

2. **Neue Seite "Pizza Abholung Zürich"** (`/pizza-abholung-zuerich`)
   - Abholpreise (Margherita 32 cm CHF 15, weitere Pizzen CHF 18 usw.), Adresse Badenerstrasse 696, Route-Link, Öffnungszeiten.

3. **Startseite inhaltlich stärken**
   - Kurzer Textabschnitt mit Ort und Angebot (Pizzeria in Zürich Altstetten, Lieferung und Abholung).
   - Sichtbare Öffnungszeiten-Tabelle (aus der Datenbank, keine erfundenen Zeiten).
   - Interne Links auf die beiden neuen Seiten und aufs Menü.

4. **Technische Feinheiten**
   - Titel und Beschreibungen der neuen Seiten über die bestehende Seo-Komponente.
   - Restaurant-Daten im Quellcode um Standort-Koordinaten und Liefergebiete ergänzen.
   - Sitemap um die neuen Seiten erweitern.

## Was Google Zeit braucht

Neue Seiten werden meist in 1–3 Wochen aufgenommen, Ranking-Verbesserungen zeigen sich über einige Wochen. Der Bestell-Link im Unternehmensprofil wirkt dagegen fast sofort.

## Technische Details

- Neue Routen in `src/App.tsx`, Seiten unter `src/pages/`, Metadaten je Seite über `src/components/Seo.tsx`.
- Liefergebiete aus `delivery_zones`, Öffnungszeiten aus `opening_hours` (kein Hardcoding).
- Preise aus `menu_items` (`pickup_price` / `delivery_price`).
- JSON-LD in `index.html`: `geo`, `areaServed`, `hasDeliveryMethod`; Öffnungszeiten sind bereits vorhanden.
- `public/sitemap.xml` um die zwei neuen URLs ergänzen.
