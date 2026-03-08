import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const Header = () => {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="DirectOrder" className="h-10 w-10 md:h-12 md:w-12" />
          <span className="font-display text-xl md:text-2xl font-bold text-foreground">
            DirectOrder
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Home
          </Link>
          <Link to="/menu" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Menü
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
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
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-secondary text-secondary-foreground"
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
            className="md:hidden overflow-hidden bg-card border-b border-border"
          >
            <nav className="container flex flex-col gap-4 py-4">
              <Link to="/" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/menu" className="text-foreground font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Menü</Link>
              
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
