import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone, User, Gift, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/piratino-logo.png";
import AuthModal from "@/components/AuthModal";

const Header = () => {
  const { totalItems } = useCart();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Piratino" className="h-10 w-auto md:h-12" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/menu" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Jetzt bestellen
            </Link>
            <Link to="/angebote" className="text-accent hover:text-accent/80 transition-colors font-medium">
              Angebote
            </Link>
            <Link to="/catering" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Catering
            </Link>
            <Link to="/reservieren" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Tisch reservieren
            </Link>
            <Link to="/galerie" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Galerie
            </Link>
            <Link to="/ueber-uns" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
              Über uns
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Points / Auth button */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/angebote"
                  className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 text-accent px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-accent/20 transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  {profile?.points_balance ?? 0} Pts
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-foreground/20 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden md:inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent px-4 py-2 rounded-full text-sm font-semibold hover:bg-accent/20 transition-colors"
              >
                <User className="w-4 h-4" />
                Anmelden
              </button>
            )}

            <a
              href="tel:+41444313233"
              className="hidden md:inline-flex items-center gap-2 border border-foreground/40 text-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-foreground/10 transition-colors"
            >
              <Phone className="w-4 h-4" />
              044 431 32 33
            </a>

            <Link
              to="/cart"
              className="relative flex items-center justify-center w-11 h-11 rounded-full border border-foreground/40 text-foreground hover:bg-foreground/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            <button
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-full border border-foreground/40 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-background border-b border-border"
            >
              <nav className="container flex flex-col gap-4 py-4">
                <Link to="/" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/menu" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Jetzt bestellen</Link>
                <Link to="/angebote" className="text-accent font-medium py-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Gift className="w-4 h-4" /> Angebote
                  {user && <span className="text-xs bg-accent/20 px-2 py-0.5 rounded-full">{profile?.points_balance ?? 0} Pts</span>}
                </Link>
                <Link to="/catering" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Catering</Link>
                <Link to="/reservieren" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Tisch reservieren</Link>
                <Link to="/galerie" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Galerie</Link>
                <Link to="/ueber-uns" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Über uns</Link>
                {user ? (
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="text-muted-foreground font-medium py-2 flex items-center gap-2 text-left">
                    <LogOut className="w-4 h-4" /> Abmelden
                  </button>
                ) : (
                  <button onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }} className="text-accent font-medium py-2 flex items-center gap-2 text-left">
                    <User className="w-4 h-4" /> Anmelden & Punkte sammeln
                  </button>
                )}
                <a href="tel:+41444313233" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Phone className="w-4 h-4" /> 044 431 32 33
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Header;
