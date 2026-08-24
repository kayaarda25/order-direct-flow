import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TimeRange = [number, number, number, number];

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const fmt = (r: TimeRange) =>
  `${String(r[0]).padStart(2, "0")}:${String(r[1]).padStart(2, "0")} – ${String(r[2]).padStart(2, "0")}:${String(r[3]).padStart(2, "0")}`;

const OpeningHoursTable = () => {
  const [hours, setHours] = useState<Record<number, TimeRange[]>>({});

  useEffect(() => {
    let active = true;
    supabase
      .from("opening_hours")
      .select("day_of_week, time_ranges")
      .then(({ data }) => {
        if (!active || !data) return;
        const map: Record<number, TimeRange[]> = {};
        for (const row of data as { day_of_week: number; time_ranges: TimeRange[] }[]) {
          map[row.day_of_week] = row.time_ranges || [];
        }
        setHours(map);
      });
    return () => {
      active = false;
    };
  }, []);

  if (Object.keys(hours).length === 0) return null;

  return (
    <table className="w-full max-w-md text-sm">
      <tbody>
        {ORDER.map((day) => {
          const ranges = hours[day] || [];
          return (
            <tr key={day} className="border-b border-border/40 last:border-0">
              <th scope="row" className="py-2 text-left font-semibold text-foreground uppercase tracking-wide">
                {DAY_NAMES[day]}
              </th>
              <td className="py-2 text-right text-muted-foreground">
                {ranges.length === 0 ? "Geschlossen" : ranges.map(fmt).join(" · ")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default OpeningHoursTable;
