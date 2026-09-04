import { PackagePlus } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function NewProductPage() {
  return (
    <ComingSoonPage
      icon={PackagePlus}
      title="Mahsulot qo'shish"
      description="Do'kon yaratish va mahsulot qo'shish oynasi tez orada ishga tushadi. Avval sotuvchi sifatida ro'yxatdan o'ting."
      stage="2-3-bosqich"
    />
  );
}
