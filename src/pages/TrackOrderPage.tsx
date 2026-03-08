import { useOrder, type OrderStatus } from "@/context/OrderContext";
import { CheckCircle, Circle, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const statusSteps: { key: OrderStatus; label: string }[] = [
  { key: "received", label: "Empfangen" },
  { key: "accepted", label: "Akzeptiert" },
  { key: "preparing", label: "In Zubereitung" },
  { key: "ready", label: "Bereit" },
  { key: "out_for_delivery", label: "Unterwegs" },
  { key: "delivered", label: "Geliefert" },
];

const TrackOrderPage = () => {
  const { currentOrder } = useOrder();

  if (!currentOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center container">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Keine aktive Bestellung</h2>
        <p className="text-muted-foreground mb-6">Bestelle etwas Leckeres aus unserem Menü!</p>
        <Link to="/menu" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          Zum Menü
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === currentOrder.status);

  return (
    <div className="container py-8 max-w-lg">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
        Bestellung {currentOrder.orderNumber}
      </h1>
      <p className="text-muted-foreground mb-8">Verfolge den Status deiner Bestellung in Echtzeit</p>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-6">
          {statusSteps.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className="relative">
                  {isCompleted ? (
                    <CheckCircle className={cn("w-7 h-7", isCurrent ? "text-primary" : "text-success")} />
                  ) : (
                    <Circle className="w-7 h-7 text-muted" />
                  )}
                  {i < statusSteps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-3.5 top-8 w-0.5 h-6 -translate-x-1/2",
                        i < currentStepIndex ? "bg-success" : "bg-muted"
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium",
                    isCurrent ? "text-primary font-bold" : isCompleted ? "text-card-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
