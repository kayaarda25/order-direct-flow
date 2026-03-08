import { MapPin, Phone, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold text-card-foreground mb-3">DirectOrder</h3>
            <p className="text-muted-foreground text-sm">
              Bestelle direkt bei deinem Lieblingsrestaurant — frisch, schnell und ohne Umweg.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-card-foreground mb-3">Kontakt</h4>
            <div className="space-y-2 text-muted-foreground text-sm">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Musterstrasse 12, 8000 Zürich</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />+41 44 123 45 67</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Mo-So: 11:00 - 22:00</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-card-foreground mb-3">Liefergebiet</h4>
            <p className="text-muted-foreground text-sm">Wir liefern im Umkreis von 5km. Mindestbestellwert: CHF 25.00. Liefergebühr: CHF 5.00.</p>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-xs">
          © {new Date().getFullYear()} DirectOrder. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
