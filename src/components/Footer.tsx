import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Clock, Facebook, Instagram, Linkedin, MapPin, Music2, Phone } from "lucide-react";
import pirateMascot from "@/assets/pirate-mascot.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const FooterCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border border-primary-foreground/65 bg-primary/20 p-4">
    <h4 className="font-display text-2xl font-bold text-primary-foreground">{title}</h4>
    <div className="mt-3 text-sm text-primary-foreground/95">{children}</div>
  </section>
);

interface HoursEntry { day: string; hours: string }

const Footer = () => {
  const { content } = useSiteContent();
  const [openingHours, setOpeningHours] = useState<HoursEntry[]>([]);

  useEffect(() => {
    const fetchHours = async () => {
      const { data } = await supabase
        .from("opening_hours")
        .select("*")
        .order("day_of_week");
      if (data && data.length > 0) {
        setOpeningHours(
          data.map((d: any) => {
            const ranges = (d.time_ranges as number[][]) || [];
            const hoursStr = ranges.length === 0
              ? "Geschlossen"
              : ranges
                  .map(([sh, sm, eh, em]: number[]) =>
                    `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")} - ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
                  )
                  .join(" und ");
            return { day: DAY_NAMES[d.day_of_week], hours: hoursStr };
          })
        );
      } else {
        // Fallback
        setOpeningHours([
          { day: "Montag", hours: "11:00 - 14:00 und 17:00 - 22:00" },
          { day: "Dienstag", hours: "11:00 - 14:00 und 17:00 - 22:00" },
          { day: "Mittwoch", hours: "11:00 - 14:00 und 17:00 - 22:00" },
          { day: "Donnerstag", hours: "11:00 - 14:00 und 17:00 - 22:00" },
          { day: "Freitag", hours: "11:00 - 14:00 und 17:00 - 23:00" },
          { day: "Samstag", hours: "11:00 - 23:00" },
          { day: "Sonntag", hours: "14:00 - 22:00" },
        ]);
      }
    };
    fetchHours();
  }, []);

  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="container py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <img src={pirateMascot} alt="Piratino Maskottchen" className="h-24 w-auto" loading="lazy" />

            <FooterCard title="Kontakt">
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>{content.footer_address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{content.footer_phone}</span>
                </p>
                <p className="text-primary-foreground/85">{content.footer_email}</p>
              </div>
            </FooterCard>

            <FooterCard title="Öffnungszeiten">
              <div className="space-y-1.5">
                {openingHours.map((entry) => (
                  <div key={entry.day} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <span className="font-medium">{entry.day}</span>
                    <span className="text-primary-foreground/85">{entry.hours}</span>
                  </div>
                ))}
              </div>
            </FooterCard>

            <FooterCard title="Social Media">
              <div className="flex flex-wrap items-center gap-4">
                <a href="#" aria-label="Instagram" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Instagram className="h-5 w-5" />
                  <span>@pizzapiratino</span>
                </a>
                <a href="#" aria-label="TikTok" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Music2 className="h-5 w-5" />
                  <span>@pizzapiratino</span>
                </a>
                <a href="#" aria-label="Facebook" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Facebook className="h-5 w-5" />
                  <span>Facebook</span>
                </a>
                <a href="#" aria-label="LinkedIn" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Linkedin className="h-5 w-5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </FooterCard>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden border border-primary-foreground/65 bg-card/10">
              <iframe
                title="Karte Piratino"
                src="https://www.openstreetmap.org/export/embed.html?bbox=8.466%2C47.371%2C8.48%2C47.379&layer=mapnik&marker=47.3754%2C8.4731"
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-right text-xs text-primary-foreground/80">
              © {new Date().getFullYear()} Piratino AG · Pizza, Pasta and more since 2006.
            </p>
            <p className="flex items-center justify-end gap-2 text-xs text-primary-foreground/80">
              <Clock className="h-3.5 w-3.5" />
              Öffnungszeiten wie links aufgeführt.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
