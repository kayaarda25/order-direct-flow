import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 80px)" }}>
      <iframe
        loading="lazy"
        src="https://www.canva.com/design/DAHBmbHufaM/-IyjnyoVp3hhYf9JBE0XIw/view?embed"
        allowFullScreen
        allow="fullscreen"
        className="w-full h-full border-none pointer-events-none"
        title="Pizzeria Piratino Website"
      />
      {/* Overlay buttons matching the Canva design positions */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
        <div className="flex gap-4 pointer-events-auto ml-[6%] mt-[18%] flex-wrap">
          <Link
            to="/menu"
            className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Jetzt bestellen
          </Link>
          <Link
            to="/reservation"
            className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Tisch reservieren
          </Link>
          <Link
            to="/catering"
            className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Catering Anfrage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
