import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Helmet>
        <title>Seite nicht gefunden | Pizza Piratino Zürich</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Diese Seite gibt es nicht</p>
        <p className="mb-6 text-muted-foreground">
          Vielleicht suchst du unsere Speisekarte?
        </p>
        <a href="/menu" className="text-primary underline hover:text-primary/90">
          Zum Menü
        </a>
      </div>
    </div>
  );
};

export default NotFound;
