import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/context/AdminContext";

interface AdminUser {
  id: string;
  created_at: string;
}

const AdminUsers = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const { session } = useAdmin();

  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admin_users").select("*").order("created_at");
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const addAdmin = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "E-Mail und Passwort erforderlich", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      // Sign up the new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Benutzer konnte nicht erstellt werden");

      // Add to admin_users table
      const { error: insertError } = await supabase.from("admin_users").insert({ id: signUpData.user.id });
      if (insertError) throw insertError;

      setNewEmail("");
      setNewPassword("");
      fetchAdmins();
      toast({ title: "Admin hinzugefügt", description: `${newEmail} wurde als Admin registriert.` });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (id: string) => {
    if (id === session?.user?.id) {
      toast({ title: "Fehler", description: "Du kannst dich nicht selbst entfernen.", variant: "destructive" });
      return;
    }
    if (!confirm("Admin-Zugang wirklich entfernen?")) return;
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setAdmins((a) => a.filter((item) => item.id !== id));
    toast({ title: "Admin entfernt" });
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin-Benutzer</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Neuen Admin hinzufügen</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">E-Mail</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@piratino.ch"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Passwort</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <Button onClick={addAdmin} disabled={adding}>
              <UserPlus className="h-4 w-4 mr-1" /> {adding ? "Wird erstellt..." : "Hinzufügen"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer-ID</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-mono text-sm">
                    {admin.id.slice(0, 8)}...
                    {admin.id === session?.user?.id && (
                      <span className="ml-2 text-xs text-primary font-medium">(Du)</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString("de-CH")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAdmin(admin.id)}
                      disabled={admin.id === session?.user?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
