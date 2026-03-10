import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarDays, Clock, Users, Phone, Mail, User } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const ReservationPage = () => {
  const { content } = useSiteContent();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    persons: "2",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const subject = `Tischreservierung für ${form.persons} Personen am ${form.date}`;
    const body = [
      `Name: ${form.name}`,
      `E-Mail: ${form.email}`,
      `Telefon: ${form.phone}`,
      `Datum: ${form.date}`,
      `Uhrzeit: ${form.time}`,
      `Personen: ${form.persons}`,
      form.message ? `Nachricht: ${form.message}` : "",
    ].filter(Boolean).join("%0A");

    window.location.href = `mailto:info@piratino.ch?subject=${encodeURIComponent(subject)}&body=${body}`;

    setTimeout(() => {
      toast.success("Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die E-Mail ab.");
      setSending(false);
    }, 1000);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-3 uppercase tracking-wider">
            {content.reservation_title}
          </h1>
          <p className="text-primary-foreground/60 text-sm uppercase tracking-wide">
            {content.reservation_text}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
              <User className="w-4 h-4" /> Name *
            </label>
            <input
              required
              type="text"
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
                <Mail className="w-4 h-4" /> E-Mail *
              </label>
              <input
                required
                type="email"
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
                <Phone className="w-4 h-4" /> Telefon *
              </label>
              <input
                required
                type="tel"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
                <CalendarDays className="w-4 h-4" /> Datum *
              </label>
              <input
                required
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
                <Clock className="w-4 h-4" /> Uhrzeit *
              </label>
              <select
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Wählen...</option>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t} Uhr</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium mb-1">
                <Users className="w-4 h-4" /> Personen *
              </label>
              <select
                required
                value={form.persons}
                onChange={(e) => setForm({ ...form, persons: e.target.value })}
                className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "Person" : "Personen"}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-primary-foreground/80 text-sm font-medium mb-1 block">Besondere Wünsche</label>
            <textarea
              rows={3}
              maxLength={500}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Allergien, Kinderstühle, besondere Anlässe..."
              className="w-full border border-primary-foreground/20 rounded-lg px-4 py-3 text-primary-foreground bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-card text-foreground font-semibold py-3 rounded-lg hover:bg-card/80 transition-colors uppercase tracking-wide text-sm disabled:opacity-50"
          >
            {sending ? "Wird gesendet..." : "Tisch reservieren"}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default ReservationPage;
