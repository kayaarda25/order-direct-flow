// Opening hours per day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
// Each day has an array of time ranges [startHour, startMin, endHour, endMin]
type TimeRange = [number, number, number, number];

const schedule: Record<number, TimeRange[]> = {
  0: [[14, 0, 22, 0]],                        // Sonntag
  1: [[11, 0, 14, 0], [17, 0, 22, 0]],        // Montag
  2: [[11, 0, 14, 0], [17, 0, 22, 0]],        // Dienstag
  3: [[11, 0, 14, 0], [17, 0, 22, 0]],        // Mittwoch
  4: [[11, 0, 14, 0], [17, 0, 22, 0]],        // Donnerstag
  5: [[11, 0, 14, 0], [17, 0, 23, 0]],        // Freitag
  6: [[11, 0, 23, 0]],                         // Samstag
};

export function isRestaurantOpen(now = new Date()): boolean {
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const ranges = schedule[day] || [];
  return ranges.some(([sh, sm, eh, em]) => {
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return currentMinutes >= start && currentMinutes < end;
  });
}

export function getTodayHoursLabel(now = new Date()): string {
  const day = now.getDay();
  const ranges = schedule[day] || [];
  if (ranges.length === 0) return "Heute geschlossen";
  return ranges
    .map(([sh, sm, eh, em]) => `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")} - ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`)
    .join(", ");
}

/** Generate available scheduled time slots for today and tomorrow */
export function getScheduledTimeSlots(now = new Date()): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const day = date.getDay();
    const ranges = schedule[day] || [];
    const dateStr = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
    const dayLabel = dayOffset === 0 ? "Heute" : `Morgen (${dayNames[day]})`;

    for (const [sh, sm, eh, em] of ranges) {
      let startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      // If today, start from at least 30 min from now
      if (dayOffset === 0) {
        const nowMin = now.getHours() * 60 + now.getMinutes();
        startMin = Math.max(startMin, nowMin + 30);
        // Round up to next 15 min
        startMin = Math.ceil(startMin / 15) * 15;
      }

      for (let m = startMin; m <= endMin - 15; m += 15) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        slots.push({
          label: `${dayLabel} ${dateStr}, ${timeStr}`,
          value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${timeStr}`,
        });
      }
    }
  }

  return slots;
}
