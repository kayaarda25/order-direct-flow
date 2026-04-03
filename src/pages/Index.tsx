import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <iframe
        loading="lazy"
        src="https://www.canva.com/design/DAHBmbHufaM/-IyjnyoVp3hhYf9JBE0XIw/view?embed"
        allowFullScreen
        allow="fullscreen"
        className="border-none origin-top-left"
        style={{ width: "111%", height: "111%", transform: "scale(0.9)", transformOrigin: "top left" }}
        title="Pizzeria Piratino Website"
      />

      {/* ── Header nav overlays ── */}
      <Link to="/" className="absolute z-10" style={{ left: "20.5%", top: "1.5%", width: "7%", height: "8%" }} aria-label="Home" />
      <Link to="/menu" className="absolute z-10" style={{ left: "29%", top: "1.5%", width: "6%", height: "8%" }} aria-label="Menu" />
      <Link to="/galerie" className="absolute z-10" style={{ left: "37%", top: "1.5%", width: "6.5%", height: "8%" }} aria-label="Galerie" />
      <Link to="/ueber-uns" className="absolute z-10" style={{ left: "45%", top: "1.5%", width: "7.5%", height: "8%" }} aria-label="Über uns" />
      <a href="mailto:info@pizzeria-piratino.ch" className="absolute z-10" style={{ left: "54.5%", top: "1.5%", width: "7%", height: "8%" }} aria-label="Kontakt" />
      <a href="tel:+41444313233" className="absolute z-10" style={{ left: "72%", top: "2%", width: "16%", height: "7%" }} aria-label="Anrufen" />
      <Link to="/cart" className="absolute z-10" style={{ left: "90%", top: "1.5%", width: "5%", height: "8%" }} aria-label="Warenkorb" />

      {/* ── Hero buttons ── */}
      <Link to="/menu" className="absolute z-10" style={{ left: "6%", top: "65%", width: "22%", height: "8%" }} aria-label="Jetzt bestellen" />
      <Link to="/reservieren" className="absolute z-10" style={{ left: "29.5%", top: "65%", width: "22%", height: "8%" }} aria-label="Tisch reservieren" />
      <Link to="/catering" className="absolute z-10" style={{ left: "53%", top: "65%", width: "22%", height: "8%" }} aria-label="Catering Anfrage" />
    </div>
  );
};

export default Index;
