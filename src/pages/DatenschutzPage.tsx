import Seo from "@/components/Seo";
import { CONSENT_STORAGE_KEY } from "@/lib/googleAdsTracking";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const reopenConsent = () => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Reload still shows the banner when storage is unavailable.
  }
  window.location.reload();
};

const DatenschutzPage = () => {
  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <Seo
        title="Datenschutzerklärung | Pizza Piratino Zürich"
        description="Datenschutzerklärung von Pizza Piratino: welche Daten bei Bestellungen, Reservationen und Werbemessung verarbeitet werden."
        path="/datenschutz"
      />

      <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Datenschutzerklärung</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Diese Erklärung beschreibt, welche Daten wir bei der Nutzung von piratino-pizzeria.ch verarbeiten.
      </p>

      <Section title="Verantwortlich">
        <p>
          Piratino AG, Badenerstrasse 696, 8048 Zürich, Schweiz
          <br />
          Telefon: +41 44 431 32 33
          <br />
          E-Mail: piratino@hotmail.com
        </p>
      </Section>

      <Section title="Bestellungen, Reservationen und Catering">
        <p>
          Für Bestellungen verarbeiten wir Name, Telefonnummer, bei Lieferungen die Adresse, die gewählten Artikel,
          Zahlungsart und allfällige Bemerkungen. Diese Daten benötigen wir zur Zubereitung, Lieferung und Abrechnung
          und geben sie an unser Kassen- und Küchensystem weiter. Bei Reservationen und Catering-Anfragen verarbeiten
          wir die im Formular angegebenen Kontakt- und Terminangaben.
        </p>
      </Section>

      <Section title="Kundenkonto und Treueprogramm">
        <p>
          Wenn du ein Konto erstellst, speichern wir E-Mail-Adresse, Name und deine Treuepunkte, um Punkte und
          Gutscheine korrekt zuordnen zu können.
        </p>
      </Section>

      <Section title="Cookies und Reichweitenmessung">
        <p>
          Wir erfassen anonyme Nutzungsdaten (aufgerufene Seiten, Gerätetyp, Herkunft des Besuchs), um die Website zu
          verbessern. Diese Daten enthalten keine Namen oder Adressen.
        </p>
      </Section>

      <Section title="Google Ads und Conversion-Messung">
        <p>
          Wir schalten Werbung über Google Ads und messen mit Google-Technologie, ob eine Bestellung nach einem Klick
          auf eine Anzeige zustande gekommen ist. Dabei werden Cookies eingesetzt sowie der Bestellwert und eine
          Bestellnummer an Google übermittelt.
        </p>
        <p>
          Hast du der Verwendung von Cookies zugestimmt und bist in deinem Kundenkonto eingeloggt, übermitteln wir
          zusätzlich deine E-Mail-Adresse in verschlüsselter (gehashter) Form an Google, damit die Messung genauer
          wird («erweiterte Conversions»). Weitere persönliche Angaben werden nicht übermittelt. Ohne deine
          Zustimmung erfolgt keine solche Übermittlung.
        </p>
        <p>
          Anbieterin ist Google Ireland Limited; eine Übermittlung in die USA ist möglich. Informationen dazu findest
          du in Googles Datenschutzerklärung.
        </p>
        <p>
          <button
            type="button"
            onClick={reopenConsent}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Cookie-Einstellungen ändern
          </button>
        </p>
      </Section>

      <Section title="Aufbewahrung">
        <p>
          Bestell- und Buchhaltungsdaten bewahren wir so lange auf, wie es gesetzlich vorgeschrieben ist. Danach
          werden sie gelöscht oder anonymisiert.
        </p>
      </Section>

      <Section title="Deine Rechte">
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch bezüglich deiner Daten. Melde dich
          dafür einfach per E-Mail an piratino@hotmail.com oder telefonisch.
        </p>
      </Section>
    </div>
  );
};

export default DatenschutzPage;
