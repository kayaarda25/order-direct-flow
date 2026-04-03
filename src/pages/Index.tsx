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
      {/* Transparent overlay links positioned exactly over the Canva buttons */}
      <Link
        to="/menu"
        className="absolute block hover:bg-white/10 transition-colors rounded"
        style={{ left: "6.5%", bottom: "24%", width: "20%", height: "6.5%" }}
        aria-label="Jetzt bestellen"
      />
      <Link
        to="/reservieren"
        className="absolute block hover:bg-white/10 transition-colors rounded"
        style={{ left: "29%", bottom: "24%", width: "20%", height: "6.5%" }}
        aria-label="Tisch reservieren"
      />
      <Link
        to="/catering"
        className="absolute block hover:bg-white/10 transition-colors rounded"
        style={{ left: "51.5%", bottom: "24%", width: "20%", height: "6.5%" }}
        aria-label="Catering Anfrage"
      />
    </div>
  );
};

export default Index;
