import { useState, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MenuItemDialog from "@/components/MenuItemDialog";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  allergens: string[];
  available: boolean;
}

const AdminDashboard = () => {
  const { signOut, isAdmin, isLoading } = useAdmin();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Menüelemente konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Element löschen möchten?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMenuItems(items => items.filter(item => item.id !== id));
      toast({
        title: "Erfolgreich gelöscht",
        description: "Das Menüelement wurde entfernt.",
      });
    } catch (error) {
      toast({
        title: "Fehler beim Löschen",
        description: "Das Element konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchMenuItems();
    }
  }, [isAdmin, isLoading]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleItemSaved = () => {
    fetchMenuItems();
    handleDialogClose();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
            <p>Sie haben keine Berechtigung für den Admin-Bereich.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Admin Dashboard
          </h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Menü verwalten</CardTitle>
            <Button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Neues Element
            </Button>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="text-center py-8">Menü wird geladen...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Preis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>CHF {item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={item.available ? "default" : "secondary"}>
                          {item.available ? "Verfügbar" : "Nicht verfügbar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMenuItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {menuItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Keine Menüelemente vorhanden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSaved={handleItemSaved}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default AdminDashboard;