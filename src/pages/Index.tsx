import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <iframe
        loading="lazy"
        src="https://www.canva.com/design/DAHBmbHufaM/-IyjnyoVp3hhYf9JBE0XIw/view?embed"
        allowFullScreen
        allow="fullscreen"
        className="w-full h-full border-none"
        title="Pizzeria Piratino Website"
      />

      {/* ── Header nav overlays ── */}
      <Link to="/" className="absolute hover:bg-white/10 transition-colors" style={{ left: "22.5%", top: "3.2%", width: "6%", height: "4%" }} aria-label="Home" />
      <Link to="/menu" className="absolute hover:bg-white/10 transition-colors" style={{ left: "30.5%", top: "3.2%", width: "5.5%", height: "4%" }} aria-label="Menu" />
      <Link to="/galerie" className="absolute hover:bg-white/10 transition-colors" style={{ left: "38%", top: "3.2%", width: "5.5%", height: "4%" }} aria-label="Galerie" />
      <Link to="/ueber-uns" className="absolute hover:bg-white/10 transition-colors" style={{ left: "46%", top: "3.2%", width: "6.5%", height: "4%" }} aria-label="Über uns" />
      <a href="mailto:info@pizzeria-piratino.ch" className="absolute hover:bg-white/10 transition-colors" style={{ left: "54.5%", top: "3.2%", width: "6%", height: "4%" }} aria-label="Kontakt" />
      <a href="tel:+41444313233" className="absolute hover:bg-white/10 transition-colors rounded-full" style={{ left: "73.5%", top: "2.5%", width: "14%", height: "5%" }} aria-label="044 431 32 33" />
      <Link to="/cart" className="absolute hover:bg-white/10 transition-colors" style={{ left: "92%", top: "2.5%", width: "4%", height: "5%" }} aria-label="Warenkorb" />

      {/* ── Hero buttons ── */}
      <Link to="/menu" className="absolute hover:bg-white/10 transition-colors rounded" style={{ left: "6.5%", top: "71%", width: "20%", height: "7%" }} aria-label="Jetzt bestellen" />
      <Link to="/reservieren" className="absolute hover:bg-white/10 transition-colors rounded" style={{ left: "29%", top: "71%", width: "20%", height: "7%" }} aria-label="Tisch reservieren" />
      <Link to="/catering" className="absolute hover:bg-white/10 transition-colors rounded" style={{ left: "51.5%", top: "71%", width: "20%", height: "7%" }} aria-label="Catering Anfrage" />
    </div>
  );
};

export default Index;
