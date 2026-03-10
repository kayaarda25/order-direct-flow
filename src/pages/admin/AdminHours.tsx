import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

interface TimeRange {
  startH: number;
  startM: number;
  endH: number;
  endM: number;
}

interface DaySchedule {
  id: string;
  day_of_week: number;
  ranges: TimeRange[];
}

const parseRanges = (jsonb: unknown): TimeRange[] => {
  const arr = jsonb as number[][];
  return arr.map(([startH, startM, endH, endM]) => ({ startH, startM, endH, endM }));
};

const formatTime = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

const parseTime = (str: string): [number, number] => {
  const [h, m] = str.split(":").map(Number);
  return [h || 0, m || 0];
};

const AdminHours = () => {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchHours = async () => {
    const { data, error } = await supabase
      .from("opening_hours")
      .select("*")
      .order("day_of_week");
    if (error) {
      toast({ title: "Fehler", variant: "destructive" });
      return;
    }
    setSchedules(
      (data || []).map((d: any) => ({
        id: d.id,
        day_of_week: d.day_of_week,
        ranges: parseRanges(d.time_ranges),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchHours(); }, []);

  const updateRange = (dayIdx: number, rangeIdx: number, field: "start" | "end", value: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day_of_week !== dayIdx) return s;
        const ranges = [...s.ranges];
        const [h, m] = parseTime(value);
        if (field === "start") {
          ranges[rangeIdx] = { ...ranges[rangeIdx], startH: h, startM: m };
        } else {
          ranges[rangeIdx] = { ...ranges[rangeIdx], endH: h, endM: m };
        }
        return { ...s, ranges };
      })
    );
  };

  const addRange = (dayIdx: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayIdx
          ? { ...s, ranges: [...s.ranges, { startH: 11, startM: 0, endH: 22, endM: 0 }] }
          : s
      )
    );
  };

  const removeRange = (dayIdx: number, rangeIdx: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayIdx
          ? { ...s, ranges: s.ranges.filter((_, i) => i !== rangeIdx) }
          : s
      )
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const s of schedules) {
        const timeRanges = s.ranges.map((r) => [r.startH, r.startM, r.endH, r.endM]);
        const { error } = await supabase
          .from("opening_hours")
          .update({ time_ranges: timeRanges, updated_at: new Date().toISOString() })
          .eq("id", s.id);
        if (error) throw error;
      }
      toast({ title: "Gespeichert", description: "Öffnungszeiten wurden aktualisiert." });
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center">Laden...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Öffnungszeiten</h1>
        <Button onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? "Speichern..." : "Speichern"}
        </Button>
      </div>

      <div className="space-y-4">
        {schedules.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{DAY_NAMES[s.day_of_week]}</CardTitle>
            </CardHeader>
            <CardContent>
              {s.ranges.length === 0 && (
                <p className="text-sm text-muted-foreground mb-2">Geschlossen</p>
              )}
              <div className="space-y-2">
                {s.ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formatTime(r.startH, r.startM)}
                      onChange={(e) => updateRange(s.day_of_week, i, "start", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">bis</span>
                    <Input
                      type="time"
                      value={formatTime(r.endH, r.endM)}
                      onChange={(e) => updateRange(s.day_of_week, i, "end", e.target.value)}
                      className="w-32"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeRange(s.day_of_week, i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => addRange(s.day_of_week)}>
                <Plus className="h-3 w-3 mr-1" /> Zeitfenster
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminHours;
