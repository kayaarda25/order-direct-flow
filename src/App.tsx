import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import Header from "@/components/Header";
import ClosedBanner from "@/components/ClosedBanner";
import { isRestaurantOpen } from "@/utils/openingHours";
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

const App = () => {
  const [isOpen, setIsOpen] = useState(() => isRestaurantOpen());

  useEffect(() => {
    const interval = setInterval(() => setIsOpen(isRestaurantOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <CartProvider>
          <OrderProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                        <Route path="/galerie" element={<GalleryPage />} />
                        <Route path="/ueber-uns" element={<AboutPage />} />
                        <Route path="/catering" element={<CateringPage />} />
                        <Route path="/reservieren" element={<ReservationPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order/:id" element={<OrderConfirmationPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                } />
              </Routes>
            </BrowserRouter>
          </OrderProvider>
        </CartProvider>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
