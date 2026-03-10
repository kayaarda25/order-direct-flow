import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminMenu from "@/pages/admin/AdminMenu";
import AdminHours from "@/pages/admin/AdminHours";
import AdminZones from "@/pages/admin/AdminZones";
import AdminContent from "@/pages/admin/AdminContent";
import AdminUsers from "@/pages/admin/AdminUsers";

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <span className="font-display font-bold text-lg">Piratino Admin</span>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="hours" element={<AdminHours />} />
              <Route path="zones" element={<AdminZones />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="users" element={<AdminUsers />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
