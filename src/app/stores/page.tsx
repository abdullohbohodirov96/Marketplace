import { Store } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function StoresPage() {
  return (
    <ComingSoonPage
      icon={Store}
      title="Do'konlar ro'yxati"
      description="Barcha ro'yxatdan o'tgan do'konlar, ularning reytingi va joylashuvi bilan tez orada shu yerda ko'rinadi."
      stage="2-bosqich"
    />
  );
}
