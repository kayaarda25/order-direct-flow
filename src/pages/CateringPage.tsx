import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSiteContent } from "@/hooks/useSiteContent";
import { ArrowLeft, ArrowRight, Check, Users, MapPin, CalendarDays, Clock } from "lucide-react";
import cateringPizzaImg from "@/assets/catering-pizza-party.png";
import cateringPastaImg from "@/assets/catering-pasta.png";
import cateringAperitivoImg from "@/assets/catering-aperitivo.png";
import cateringCarneImg from "@/assets/catering-carne.png";
import cateringMareImg from "@/assets/catering-mare.png";
import cateringVerdeImg from "@/assets/catering-verde.png";

const cateringPackages = [
  {
    id: "pizza-party",
    name: "PIZZA PARTY",
    desc: "Perfekt für lockere Events, Geburtstage und Teams.",
    content: ["Pizza nach Auswahl", "2 Beilagen", "Dips"],
    pricePerPerson: 30,
    minPersons: 10,
    image: cateringPizzaImg,
  },
  {
    id: "pasta-classica",
    name: "PASTA CLASSICA",
    desc: "Perfekt für Business, Lunch und Events.",
    content: ["Pasta nach Auswahl", "2 Beilagen", "Parmesan & Toppings"],
    pricePerPerson: 30,
    minPersons: 10,
    image: cateringPastaImg,
  },
  {
    id: "aperitivo",
    name: "APERITIVO (KALT)",
    desc: "Perfekt für Apéros, Networking und Firmenevents.",
    content: ["Antipasti-Platten", "Käse, Aufschnitte und Fleisch", "Hausgemachtes Brot & Dips"],
    pricePerPerson: 35,
    minPersons: 10,
    image: cateringAperitivoImg,
  },
  {
    id: "carne",
    name: "CARNE (FLEISCH)",
    desc: "Perfekt für grössere Events, gehobene Anlässe.",
    content: ["Fleischgerichte (Poulet, Rind, Lamm, Schwein)", "2-3 warme Beilagen", "Hausgemachtes Brot & Dips"],
    pricePerPerson: 45,
    minPersons: 10,
    image: cateringCarneImg,
  },
  {
    id: "mare",
    name: "MARE (FISCH)",
    desc: "Perfekt für gehobene Business-Events.",
    content: ["Fischgerichte (kalt und warm)", "Beilagen", "Hausgemachtes Brot & Dips"],
    pricePerPerson: 45,
    minPersons: 10,
    image: cateringMareImg,
  },
  {
    id: "verde",
    name: "VERDE (VEGAN)",
    desc: "Perfekt für moderne Events.",
    content: ["Vegane/ Vegetarische Hauptgerichte", "Beilagen", "Salate"],
    pricePerPerson: 25,
    minPersons: 10,
    image: cateringVerdeImg,
  },
];

const CateringPage = () => {
  const { content } = useSiteContent();
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [persons, setPersons] = useState(10);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    street: "",
    plz: "",
    city: "",
    date: "",
    time: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedPackage = cateringPackages.find((p) => p.id === selectedPackageId);
  const totalPrice = selectedPackage ? selectedPackage.pricePerPerson * persons : 0;
  const today = new Date().toISOString().split("T")[0];

  const goToStep2 = () => {
    if (!selectedPackageId) {
      toast.error("Bitte wählen Sie ein Catering-Paket aus.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate sending - in production this would go to an API
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container max-w-3xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s
                    ? "bg-card text-foreground"
                    : "bg-primary-foreground/10 text-primary-foreground/40"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 md:w-24 h-0.5 ${step > s ? "bg-card" : "bg-primary-foreground/10"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Package Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2 uppercase tracking-wider">
                Catering buchen
              </h1>
              <p className="text-primary-foreground/60 text-sm uppercase tracking-wide mb-8">
                Schritt 1: Wählen Sie Ihr Wunschpaket
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {cateringPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`text-left bg-card border rounded-xl overflow-hidden transition-all ${
                      selectedPackageId === pkg.id
                        ? "border-accent ring-2 ring-accent scale-[1.02]"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <img src={pkg.image} alt={pkg.name} className="w-20 h-20 object-contain flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">
                          {pkg.name}
                        </h3>
                        <p className="text-muted-foreground text-xs mb-2">{pkg.desc}</p>
                        <p className="text-foreground font-bold text-xs">CHF {pkg.pricePerPerson.toFixed(2)} pro Person</p>
                        <p className="text-muted-foreground text-xs">Min. {pkg.minPersons} Personen</p>
                      </div>
                    </div>
                    {selectedPackageId === pkg.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        <p className="text-foreground text-xs font-semibold uppercase mb-1">Inhalt:</p>
                        <ul className="text-muted-foreground text-xs space-y-0.5">
                          {pkg.content.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={goToStep2}
                className="flex items-center gap-2 bg-card text-foreground font-semibold px-8 py-3 rounded-lg hover:bg-card/80 transition-colors uppercase tracking-wide text-sm ml-auto"
              >
                Weiter <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Details & Booking */}
          {step === 2 && selectedPackage && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-1 text-primary-foreground/60 text-sm mb-6 hover:text-primary-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Zurück zur Paketauswahl
              </button>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2 uppercase tracking-wider">
                {selectedPackage.name}
              </h1>
              <p className="text-primary-foreground/60 text-sm uppercase tracking-wide mb-8">
                Schritt 2: Details & verbindliche Offerte
              </p>

              {/* Selected package summary */}
              <div className="bg-card rounded-xl p-5 mb-8 flex items-center gap-4">
                <img src={selectedPackage.image} alt={selectedPackage.name} className="w-16 h-16 object-contain" />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground text-sm uppercase">{selectedPackage.name}</h3>
                  <p className="text-muted-foreground text-xs">{selectedPackage.desc}</p>
                  <ul className="text-muted-foreground text-xs mt-1">
                    {selectedPackage.content.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Person count + price calculation */}
              <div className="bg-primary-foreground/5 rounded-xl p-5 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-primary-foreground/60" />
                  <label className="text-primary-foreground font-medium text-sm">Anzahl Personen</label>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setPersons(Math.max(selectedPackage.minPersons, persons - 1))}
                    className="w-10 h-10 rounded-full border border-primary-foreground/20 text-primary-foreground font-bold text-lg hover:bg-primary-foreground/10 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-primary-foreground w-16 text-center">{persons}</span>
                  <button
                    type="button"
                    onClick={() => setPersons(persons + 1)}
                    className="w-10 h-10 rounded-full border border-primary-foreground/20 text-primary-foreground font-bold text-lg hover:bg-primary-foreground/10 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="border-t border-primary-foreground/10 pt-4 flex justify-between items-center">
                  <span className="text-primary-foreground/60 text-sm">
                    {persons} × CHF {selectedPackage.pricePerPerson.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold text-primary-foreground">
                    CHF {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Booking form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-xl font-bold text-primary-foreground uppercase tracking-wide">
                  Kontaktdaten
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Name *</label>
                    <input
                      required type="text" maxLength={100}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Firma</label>
                    <input
                      type="text" maxLength={100}
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">E-Mail *</label>
                    <input
                      required type="email" maxLength={255}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Telefon *</label>
                    <input
                      required type="tel" maxLength={20}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <h2 className="font-display text-xl font-bold text-primary-foreground uppercase tracking-wide pt-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Lieferadresse
                </h2>

                <div>
                  <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Strasse & Nr. *</label>
                  <input
                    required type="text" maxLength={200}
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">PLZ *</label>
                    <input
                      required type="text" maxLength={10}
                      value={form.plz}
                      onChange={(e) => setForm({ ...form, plz: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Ort *</label>
                    <input
                      required type="text" maxLength={100}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <h2 className="font-display text-xl font-bold text-primary-foreground uppercase tracking-wide pt-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> Wann & Wie
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Datum *</label>
                    <input
                      required type="date" min={today}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-primary-foreground/80 text-sm font-medium mb-1">
                      <Clock className="w-4 h-4" /> Uhrzeit *
                    </label>
                    <input
                      required type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Besondere Wünsche</label>
                  <textarea
                    rows={3} maxLength={1000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Allergien, Aufbau, Geschirr, besondere Wünsche..."
                    className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>

                {/* Price Summary */}
                <div className="bg-card rounded-xl p-5">
                  <h3 className="font-display font-bold text-foreground uppercase text-sm mb-3">Zusammenfassung</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{selectedPackage.name}</span>
                      <span>CHF {selectedPackage.pricePerPerson.toFixed(2)} / Pers.</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Anzahl Personen</span>
                      <span>{persons}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between text-foreground font-bold text-lg">
                      <span>Gesamtpreis</span>
                      <span>CHF {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-primary-foreground/40 text-xs">
                  Mit dem Absenden bestätigen Sie eine verbindliche Catering-Offerte. Wir melden uns innerhalb von 24 Stunden bei Ihnen.
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-card text-foreground font-semibold py-4 rounded-lg hover:bg-card/80 transition-colors uppercase tracking-wide text-sm disabled:opacity-50"
                >
                  {sending ? "Wird gesendet..." : `Verbindliche Offerte senden – CHF ${totalPrice.toFixed(2)}`}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && selectedPackage && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold text-primary-foreground mb-3 uppercase">
                Offerte gesendet!
              </h1>
              <p className="text-primary-foreground/60 text-sm max-w-md mx-auto mb-6">
                Vielen Dank für Ihre Catering-Anfrage. Wir haben Ihre verbindliche Offerte erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
              </p>

              <div className="bg-primary-foreground/5 rounded-xl p-5 max-w-sm mx-auto text-left text-sm mb-8">
                <p className="font-bold text-primary-foreground mb-2">{selectedPackage.name}</p>
                <p className="text-primary-foreground/60">{persons} Personen</p>
                <p className="text-primary-foreground/60">{form.date}, {form.time} Uhr</p>
                <p className="text-primary-foreground/60">{form.street}, {form.plz} {form.city}</p>
                <p className="font-bold text-primary-foreground mt-2 text-lg">CHF {totalPrice.toFixed(2)}</p>
              </div>

              <a
                href="/"
                className="inline-block bg-card text-foreground font-semibold px-8 py-3 rounded-lg hover:bg-card/80 transition-colors uppercase tracking-wide text-sm"
              >
                Zurück zur Startseite
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CateringPage;
