import { PackageSearch } from "lucide-react";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  return (
    <ComingSoonPage
      icon={PackageSearch}
      title="Mahsulotlar ro'yxati tez orada"
      description="Ushbu kategoriyadagi mahsulotlar, filtrlar va narx solishtirish 3–4-bosqichda ulanadi."
      stage="3-4-bosqich"
    />
  );
}
