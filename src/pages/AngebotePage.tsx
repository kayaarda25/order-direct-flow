import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Gift, Star, Trophy, Crown, Sparkles, ChevronRight, Pizza } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";

interface Reward {
  id: string;
  points_required: number;
  reward_name: string;
  reward_description: string | null;
  category: string;
  sort_order: number;
}

interface PizzaPass {
  pizza_count: number;
  free_pizzas_available: number;
  passes_completed: number;
}

const tierIcons = [Gift, Star, Sparkles, Trophy, Crown, Crown];
const tierColors = [
  "from-green-500/20 to-green-600/10 border-green-500/30",
  "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  "from-red-500/20 to-red-600/10 border-red-500/30",
];
const tierIconColors = [
  "text-green-400",
  "text-blue-400",
  "text-purple-400",
  "text-orange-400",
  "text-yellow-400",
  "text-red-400",
];

const AngebotePage = () => {
  const { user, profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pizzaPass, setPizzaPass] = useState<PizzaPass | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setRewards((data as Reward[]).filter(r => r.category !== "pizza_pass"));
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pizza_pass")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setPizzaPass(data as PizzaPass);
      });
  }, [user]);

  const handleRedeem = async (reward: Reward) => {
    if (!user) { setAuthOpen(true); return; }
    if (!profile || profile.points_balance < reward.points_required) {
      toast.error("Nicht genügend Punkte"); return;
    }
    setRedeeming(reward.id);
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_user_id: user.id, p_reward_id: reward.id,
    });
    if (error || data === false) {
      toast.error("Einlösen fehlgeschlagen");
    } else {
      toast.success(`${reward.reward_name} eingelöst! Zeige dies bei deiner nächsten Bestellung.`);
      window.location.reload();
    }
    setRedeeming(null);
  };

  const pointsBalance = profile?.points_balance ?? 0;
  const pizzaCount = pizzaPass?.pizza_count ?? 0;
  const freePizzas = pizzaPass?.free_pizzas_available ?? 0;

  return (
    <div className="min-h-screen bg-white" style={{ '--background': '0 0% 100%', '--foreground': '0 0% 10%', '--card': '0 0% 97%', '--card-foreground': '0 0% 10%', '--muted-foreground': '0 0% 40%', '--border': '0 0% 88%', '--secondary': '0 0% 95%', '--secondary-foreground': '0 0% 10%' } as React.CSSProperties}>
    <div className="container py-8 md:py-12 max-w-4xl text-foreground">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 mb-4">
          <Gift className="w-4 h-4 text-accent" />
          <span className="text-accent text-sm font-semibold">Piratino Bonusprogramm</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
          Sammle Punkte, erhalte Belohnungen
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Für jeden ausgegebenen Franken erhältst du <span className="text-accent font-bold">5 Punkte</span>. Löse deine Punkte gegen leckere Belohnungen ein!
        </p>
      </motion.div>

      {/* Points balance */}
      {user ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-2xl p-6 mb-10 text-center"
        >
          <p className="text-muted-foreground text-sm mb-1">Dein Punktestand</p>
          <p className="text-5xl font-bold text-foreground font-display">{pointsBalance}</p>
          <p className="text-muted-foreground text-sm mt-1">Punkte</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-6 mb-10 text-center"
        >
          <p className="text-muted-foreground mb-3">Melde dich an um Punkte zu sammeln und einzulösen</p>
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Jetzt anmelden & Punkte sammeln
          </button>
        </motion.div>
      )}

      {/* Pizza Pass Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-12"
      >
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center flex items-center justify-center gap-3">
          <Pizza className="w-7 h-7 text-accent" />
          Pizza Pass
        </h2>
        <div className="bg-gradient-to-br from-accent/15 to-warm/10 border border-accent/30 rounded-2xl p-6 md:p-8">
          <div className="text-center mb-6">
            <p className="text-foreground font-semibold text-lg mb-1">
              Bestelle 10 Pizzen — die 11. ist <span className="text-accent">GRATIS!</span>
            </p>
            <p className="text-muted-foreground text-sm">
              Jede bestellte Pizza zählt, egal welche Grösse oder Sorte.
            </p>
          </div>

          {/* Pizza stamps */}
          <div className="grid grid-cols-5 md:grid-cols-11 gap-2 md:gap-3 max-w-xl mx-auto mb-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center border-2 transition-all",
                  i < pizzaCount
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-background/30 border-foreground/10 text-muted-foreground/30"
                )}
              >
                <Pizza className="w-5 h-5 md:w-6 md:h-6" />
              </motion.div>
            ))}
            {/* 11th = free! */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center border-2 relative",
                pizzaCount >= 10 || freePizzas > 0
                  ? "bg-accent border-accent text-accent-foreground"
                  : "bg-background/30 border-dashed border-accent/40 text-accent/40"
              )}
            >
              <Gift className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-accent text-accent-foreground rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            </motion.div>
          </div>

          {/* Status */}
          {user ? (
            <div className="text-center">
              <p className="text-foreground font-semibold">
                {freePizzas > 0
                  ? `🎉 Du hast ${freePizzas} Gratis-Pizza${freePizzas > 1 ? "s" : ""} guthaben!`
                  : `${pizzaCount}/10 Pizzen — noch ${10 - pizzaCount} bis zur Gratis-Pizza`}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setAuthOpen(true)}
                className="text-accent font-semibold hover:underline text-sm"
              >
                Anmelden um deinen Pizza Pass zu starten →
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { step: "1", title: "Bestellen", desc: "Bestelle online bei Piratino" },
          { step: "2", title: "Punkte sammeln", desc: "5 Punkte pro CHF automatisch" },
          { step: "3", title: "Einlösen", desc: "Tausche Punkte gegen Belohnungen" },
        ].map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-5 text-center"
          >
            <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
              {item.step}
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">{item.title}</h3>
            <p className="text-muted-foreground text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Reward tiers */}
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
        Belohnungsstufen
      </h2>

      <div className="space-y-4">
        {rewards.map((reward, i) => {
          const Icon = tierIcons[i] || Gift;
          const colorClass = tierColors[i] || tierColors[0];
          const iconColor = tierIconColors[i] || tierIconColors[0];
          const canRedeem = user && pointsBalance >= reward.points_required;
          const progress = user ? Math.min(100, (pointsBalance / reward.points_required) * 100) : 0;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "bg-gradient-to-r border rounded-2xl p-5 md:p-6 flex items-center gap-4 md:gap-6 transition-all",
                colorClass
              )}
            >
              <div className="flex items-center gap-3 shrink-0">
                <div className={cn("w-12 h-12 rounded-full bg-background/30 flex items-center justify-center", iconColor)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="bg-background/40 backdrop-blur-sm rounded-full px-4 py-2 border border-foreground/10">
                  <span className="text-2xl md:text-3xl font-bold text-foreground">{reward.points_required}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg md:text-xl font-bold text-foreground">{reward.reward_name}</h3>
                {reward.reward_description && (
                  <p className="text-muted-foreground text-sm mt-0.5">{reward.reward_description}</p>
                )}
                {user && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={cn("h-full rounded-full", canRedeem ? "bg-accent" : "bg-foreground/40")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {canRedeem
                        ? "✅ Bereit zum Einlösen!"
                        : `Noch ${reward.points_required - pointsBalance} Punkte`}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleRedeem(reward)}
                disabled={!!redeeming || (user ? !canRedeem : false)}
                className={cn(
                  "shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-1",
                  canRedeem
                    ? "bg-accent text-accent-foreground hover:opacity-90"
                    : user
                    ? "bg-background/20 text-muted-foreground cursor-not-allowed"
                    : "bg-accent/80 text-accent-foreground hover:opacity-90"
                )}
              >
                {redeeming === reward.id ? "..." : user ? "Einlösen" : "Anmelden"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Example calculation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-card border border-border rounded-2xl p-6 text-center"
      >
        <h3 className="font-display text-lg font-bold text-foreground mb-2">Rechenbeispiel</h3>
        <p className="text-muted-foreground text-sm">
          Eine Bestellung über <span className="text-foreground font-semibold">CHF 30.00</span> = <span className="text-accent font-bold">150 Punkte</span> = Gratis Getränk! 🎉
        </p>
      </motion.div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
    </div>
  );
};

export default AngebotePage;
