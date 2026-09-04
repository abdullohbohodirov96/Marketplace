import { Search } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function SearchPage() {
  return (
    <ComingSoonPage
      icon={Search}
      title="Aqlli qidiruv"
      description="Xato yozuvlarga chidamli, lotin/kirill sinonimlarni tushunadigan qidiruv va filtrlar tez orada ishga tushadi."
      stage="4-bosqich"
    />
  );
}
