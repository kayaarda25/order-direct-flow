# Google Search Console automatisch einrichten

Ich verknüpfe Google Search Console über den Lovable-Connector, verifiziere `https://piratino-pizzeria.ch/` und reiche die Sitemap ein.

## Ablauf

1. **Google-Konto verbinden** – Es erscheint eine Connector-Karte im Chat, in der du dein Google-Konto auswählst bzw. verbindest (das Konto, das Search Console verwalten soll).
2. **Verifizierungs-Token holen** – Google gibt einen `<meta name="google-site-verification" ...>`-Tag für die Domain aus.
3. **Tag in die Seite einbauen** – Der Tag kommt in den `<head>` von `index.html`. Gleichzeitig prüfe ich, dass `public/sitemap.xml` die richtigen URLs der Live-Domain enthält.
4. **Einmal veröffentlichen** – Du klickst auf „Publish“, damit der Tag live ist. Danach klickst du auf die Aktion „Google-Setup abschliessen“.
5. **Verifizieren & Property anlegen** – Ich rufe die Verifizierung ab, lege die Property in Search Console an und reiche die Sitemap ein.
6. **Bestätigung** – Danach siehst du die Property in Search Console und kannst dort auch eine erneute Indexierung anfordern.

## Technische Details

- Connector: `google_search_console` (Lovable Connector Gateway), Verifizierungsmethode `META`, Property-Typ `SITE` mit Identifier `https://piratino-pizzeria.ch/`.
- Einzige Code-Änderung: ein zusätzliches `<meta name="google-site-verification">` im `<head>` von `index.html`; bestehende SEO-Tags, Canonical, Robots und JSON-LD bleiben unverändert.
- Sitemap-Einreichung erst nach erfolgreicher Verifizierung, an die exakt von Google zurückgegebene Property.

## Hinweis

Nach dem Setup dauert es weiterhin einige Tage, bis Google Favicon, Titel und Snippets im Suchergebnis aktualisiert – Search Console beschleunigt das nur über die Indexierungsanfrage.
