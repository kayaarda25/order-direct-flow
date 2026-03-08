import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, Phone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/piratino-logo.png";

const Header = () => {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Piratino" className="h-10 w-auto md:h-12" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/menu" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            Menu
          </Link>
          <Link to="/catering" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            Catering
          </Link>
          <Link to="/galerie" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            Galerie
          </Link>
          <Link to="/ueber-uns" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
            Über uns
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
              <Link to="/menu" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Menu</Link>
              <a href="tel:+41444313233" className="text-foreground font-medium py-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Phone className="w-4 h-4" /> 044 431 32 33
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
