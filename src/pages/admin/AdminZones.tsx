import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Zone {
  id: string;
  plz: string;
  city: string;
  minimum_order: number;
  active: boolean;
}

const AdminZones = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlz, setNewPlz] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newMin, setNewMin] = useState("40");
  const { toast } = useToast();

  const fetchZones = async () => {
    const { data, error } = await supabase.from("delivery_zones").select("*").order("plz");
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setZones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchZones(); }, []);

  const addZone = async () => {
    if (!newPlz || !newCity) return;
    const { error } = await supabase.from("delivery_zones").insert({
      plz: newPlz, city: newCity, minimum_order: parseFloat(newMin) || 0, active: true,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    setNewPlz(""); setNewCity(""); setNewMin("40");
    fetchZones();
    toast({ title: "Zone hinzugefügt" });
  };

  const toggleActive = async (zone: Zone) => {
    const { error } = await supabase.from("delivery_zones").update({ active: !zone.active }).eq("id", zone.id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setZones((z) => z.map((item) => item.id === zone.id ? { ...item, active: !item.active } : item));
  };

  const updateMinOrder = async (zone: Zone, value: string) => {
    const min = parseFloat(value) || 0;
    const { error } = await supabase.from("delivery_zones").update({ minimum_order: min }).eq("id", zone.id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setZones((z) => z.map((item) => item.id === zone.id ? { ...item, minimum_order: min } : item));
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Zone wirklich löschen?")) return;
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) { toast({ title: "Fehler", variant: "destructive" }); return; }
    setZones((z) => z.filter((item) => item.id !== id));
    toast({ title: "Gelöscht" });
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lieferzonen</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Neue Zone</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">PLZ</label>
              <Input value={newPlz} onChange={(e) => setNewPlz(e.target.value)} placeholder="8048" className="w-24" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Stadt</label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Zürich" className="w-40" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mindestbestellung (CHF)</label>
              <Input type="number" value={newMin} onChange={(e) => setNewMin(e.target.value)} className="w-28" />
            </div>
            <Button onClick={addZone}><Plus className="h-4 w-4 mr-1" /> Hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PLZ</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead>Mindestbestellung</TableHead>
                <TableHead>Aktiv</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.plz}</TableCell>
                  <TableCell>{zone.city}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={zone.minimum_order}
                      onBlur={(e) => updateMinOrder(zone, e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch checked={zone.active} onCheckedChange={() => toggleActive(zone)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => deleteZone(zone.id)}>
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

export default AdminZones;
