import { MapPin } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function MapPage() {
  return (
    <ComingSoonPage
      icon={MapPin}
      title="Do'konlar xaritasi"
      description="Malika bozoridagi barcha do'konlarni interaktiv xaritada, klasterlash bilan ko'rsatadigan sahifa tez orada tayyor bo'ladi."
      stage="6-bosqich"
    />
  );
}
