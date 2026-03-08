import { Clock } from "lucide-react";
import { getTodayHoursLabel } from "@/utils/openingHours";

const ClosedBanner = () => {
  return (
    <div className="bg-destructive/10 border-b border-destructive/20">
      <div className="container py-3 flex items-center justify-center gap-2 text-sm text-destructive font-medium">
        <Clock className="w-4 h-4" />
        <span>Wir haben gerade geschlossen — Du kannst aber eine geplante Bestellung aufgeben!</span>
        <span className="text-destructive/70 hidden sm:inline">({getTodayHoursLabel()})</span>
      </div>
    </div>
  );
};

export default ClosedBanner;
