import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
    price: "CHF 30.00 pro Person",
    minPersons: 10,
    image: cateringPizzaImg,
  },
  {
    id: "pasta-classica",
    name: "PASTA CLASSICA",
    desc: "Perfekt für Business, Lunch und Events.",
    content: ["Pasta nach Auswahl", "2 Beilagen", "Parmesan & Toppings"],
    price: "CHF 30.00 pro Person",
    minPersons: 10,
    image: cateringPastaImg,
  },
  {
    id: "aperitivo",
    name: "APERITIVO (KALT)",
    desc: "Perfekt für Apéros, Networking und Firmenevents.",
    content: ["Antipasti-Platten", "Käse, Aufschnitte und Fleisch", "Hausgemachtes Brot & Dips"],
    price: "CHF 35.00 pro Person",
    minPersons: 10,
    image: cateringAperitivoImg,
  },
  {
    id: "carne",
    name: "CARNE (FLEISCH)",
    desc: "Perfekt für grössere Events, gehobene Anlässe.",
    content: ["Fleischgerichte (Poulet, Rind, Lamm, Schwein)", "2-3 warme Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
    minPersons: 10,
    image: cateringCarneImg,
  },
  {
    id: "mare",
    name: "MARE (FISCH)",
    desc: "Perfekt für gehobene Business-Events.",
    content: ["Fischgerichte (kalt und warm)", "Beilagen", "Hausgemachtes Brot & Dips"],
    price: "CHF 45.00 pro Person",
    minPersons: 10,
    image: cateringMareImg,
  },
  {
    id: "verde",
    name: "VERDE (VEGAN)",
    desc: "Perfekt für moderne Events.",
    content: ["Vegane/ Vegetarische Hauptgerichte", "Beilagen", "Salate"],
    price: "CHF 25.00 pro Person",
    minPersons: 10,
    image: cateringVerdeImg,
  },
];

const CateringPage = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    persons: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast.error("Bitte wählen Sie ein Catering-Paket aus.");
      return;
    }
    setSending(true);

    const pkg = cateringPackages.find((p) => p.id === selectedPackage);
    const subject = `Catering Anfrage: ${pkg?.name}`;
    const body = `Name: ${form.name}%0AEmail: ${form.email}%0ATelefon: ${form.phone}%0ADatum: ${form.date}%0APersonen: ${form.persons}%0APaket: ${pkg?.name}%0ANachricht: ${form.message}`;

    window.location.href = `mailto:info@piratino.ch?subject=${encodeURIComponent(subject)}&body=${body}`;

    setTimeout(() => {
      toast.success("Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die E-Mail ab.");
      setSending(false);
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
            Catering buchen
          </h1>
          <p className="text-primary-foreground/60 text-sm uppercase tracking-wide">
            Wählen Sie Ihr Wunschpaket und senden Sie uns eine Anfrage
          </p>
        </motion.div>

        {/* Package Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {cateringPackages.map((pkg, i) => (
            <motion.button
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`text-left bg-card border rounded-xl overflow-hidden flex flex-col transition-all ${
                selectedPackage === pkg.id
                  ? "border-accent ring-2 ring-accent"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                <img src={pkg.image} alt={pkg.name} className="w-20 h-20 object-contain flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wide mb-1">
                    {pkg.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-1">{pkg.desc}</p>
                  <p className="text-foreground font-bold text-xs">{pkg.price}</p>
                </div>
              </div>
              {selectedPackage === pkg.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <p className="text-foreground text-xs font-semibold uppercase mb-1">Inhalt:</p>
                  <ul className="text-muted-foreground text-xs space-y-0.5">
                    {pkg.content.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Booking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl"
        >
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-6 uppercase">
            Anfrage senden
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-primary-foreground/80 text-sm font-medium mb-1">Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary-foreground/80 text-sm font-medium mb-1">E-Mail *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-primary-foreground/80 text-sm font-medium mb-1">Telefon *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary-foreground/80 text-sm font-medium mb-1">Wunschdatum *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-primary-foreground/80 text-sm font-medium mb-1">Anzahl Personen *</label>
                <input
                  required
                  type="number"
                  min="10"
                  value={form.persons}
                  onChange={(e) => setForm({ ...form, persons: e.target.value })}
                  placeholder="Min. 10"
                  className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-primary-foreground/80 text-sm font-medium mb-1">Nachricht</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Besondere Wünsche, Allergien, etc."
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-card text-foreground font-semibold py-3 rounded-lg hover:bg-card/80 transition-colors uppercase tracking-wide text-sm disabled:opacity-50"
            >
              {sending ? "Wird gesendet..." : "Catering Anfrage senden"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CateringPage;
