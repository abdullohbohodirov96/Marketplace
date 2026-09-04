import { Sparkles } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function PricingPage() {
  return (
    <ComingSoonPage
      icon={Sparkles}
      title="Sotuvchi tariflari"
      description="FREE, STANDARD va PRO tariflar hamda ular taqqoslovi tez orada shu yerda e'lon qilinadi. Hozircha ro'yxatdan o'tish bepul."
      stage="Kelajakda"
    />
  );
}
