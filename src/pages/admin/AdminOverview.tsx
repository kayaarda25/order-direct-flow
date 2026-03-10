import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Clock, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cards = [
  { title: "Menü verwalten", desc: "Gerichte, Preise & Bilder", icon: UtensilsCrossed, path: "/admin/menu" },
  { title: "Öffnungszeiten", desc: "Zeiten anpassen", icon: Clock, path: "/admin/hours" },
  { title: "Lieferzonen", desc: "PLZ & Mindestbestellwert", icon: MapPin, path: "/admin/zones" },
  { title: "Admin-Benutzer", desc: "Zugänge verwalten", icon: Users, path: "/admin/users" },
];

const AdminOverview = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.path}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <card.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
