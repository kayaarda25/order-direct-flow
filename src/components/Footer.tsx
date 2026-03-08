import { MapPin, Phone, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground mb-3">Piratino</h3>
            <p className="text-muted-foreground text-sm">
              Pizza, Pasta und mehr seit 2006 – das Original. Bestelle direkt bei uns.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Kontakt</h4>
            <div className="space-y-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" />Musterstrasse 12, 8000 Zürich</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-accent" />044 431 32 33</div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p>Mo-Do: 11:00-14:00, 17:00-22:00</p>
                  <p>Fr: 11:00-14:00, 17:00-23:00</p>
                  <p>Sa: 11:00-23:00</p>
                  <p>So: 14:00-22:00</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Liefergebiet</h4>
            <p className="text-muted-foreground text-sm">Wir liefern im Umkreis von 5km. Mindestbestellwert abhängig von PLZ. Liefergebühr: CHF 5.00.</p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-xs">
          © {new Date().getFullYear()} Piratino. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
