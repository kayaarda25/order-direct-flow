import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import Header from "@/components/Header";
import ClosedBanner from "@/components/ClosedBanner";
import ConsentBanner from "@/components/ConsentBanner";
import { isRestaurantOpen } from "@/utils/openingHours";
import { usePageTracking } from "@/hooks/usePageTracking";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import CateringPage from "./pages/CateringPage";
import ReservationPage from "./pages/ReservationPage";
import AngebotePage from "./pages/AngebotePage";
import AktionPage from "./pages/AktionPage";
import MenuAktionPage from "./pages/MenuAktionPage";
import DeliveryPage from "./pages/DeliveryPage";
import PickupPage from "./pages/PickupPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// Component for admin routes
const AdminRoutes = () => {
  const { session, isAdmin, isLoading } = useAdmin();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Laden...</div>
      </div>
    );
  }
  
  if (!session || !isAdmin) {
    return <AdminLogin />;
  }
  
  return <AdminDashboard />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  usePageTracking();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const App = () => {
  const [isOpen, setIsOpen] = useState(() => isRestaurantOpen());

  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isRestaurantOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminProvider>
          <SiteContentProvider>
            <CartProvider>
              <OrderProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    {/* Admin routes */}
                    <Route path="/admin/*" element={<AdminRoutes />} />
                    
                    {/* Public routes */}
                    <Route path="/*" element={
                      <div className="flex flex-col min-h-screen">
                        {!isOpen && <ClosedBanner />}
                        <Header />
                        <main className="flex-1">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/menu" element={<MenuPage />} />
                            <Route path="/angebote" element={<AngebotePage />} />
                            <Route path="/aktion" element={<AktionPage />} />
                            <Route path="/pizza-lieferung-zuerich" element={<DeliveryPage />} />
                            <Route path="/pizza-abholung-zuerich" element={<PickupPage />} />
                            <Route path="/galerie" element={<GalleryPage />} />
                            <Route path="/ueber-uns" element={<AboutPage />} />
                            <Route path="/catering" element={<CateringPage />} />
                            <Route path="/reservieren" element={<ReservationPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/order/:id" element={<OrderConfirmationPage />} />
                            <Route path="/datenschutz" element={<DatenschutzPage />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <ConsentBanner />
                        <Footer />
                      </div>
                    } />
                  </Routes>
                </BrowserRouter>
              </OrderProvider>
            </CartProvider>
          </SiteContentProvider>
        </AdminProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
