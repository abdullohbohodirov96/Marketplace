import {
  Smartphone,
  Laptop,
  Headphones,
  Cpu,
  Watch,
  Camera,
  Tablet,
  Speaker,
  Mouse,
  Keyboard,
  Monitor,
  Gamepad2,
  Tv,
  Printer,
  Router,
  Cable,
  BatteryCharging,
  HardDrive,
  MemoryStick,
  Usb,
  Wifi,
  Plug,
  Package,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface CategoryIconOption {
  key: string;
  label: string;
  Icon: LucideIcon;
}

/**
 * A curated, electronics-marketplace-relevant icon set an admin picks from
 * visually (see CategoryIconPicker) instead of typing a raw lucide-react
 * component name from memory — that free-text field existed before but had
 * no visible effect anywhere, which is exactly the kind of "I don't
 * understand what this does" friction the admin panel needed to lose.
 */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "smartphone", label: "Telefon", Icon: Smartphone },
  { key: "laptop", label: "Noutbuk", Icon: Laptop },
  { key: "tablet", label: "Planshet", Icon: Tablet },
  { key: "headphones", label: "Quloqchin", Icon: Headphones },
  { key: "watch", label: "Soat", Icon: Watch },
  { key: "camera", label: "Kamera", Icon: Camera },
  { key: "speaker", label: "Karnay", Icon: Speaker },
  { key: "monitor", label: "Monitor", Icon: Monitor },
  { key: "keyboard", label: "Klaviatura", Icon: Keyboard },
  { key: "mouse", label: "Sichqoncha", Icon: Mouse },
  { key: "cpu", label: "Protsessor", Icon: Cpu },
  { key: "hard-drive", label: "Xotira/Disk", Icon: HardDrive },
  { key: "memory-stick", label: "RAM/Flesh", Icon: MemoryStick },
  { key: "gamepad-2", label: "O'yin pulti", Icon: Gamepad2 },
  { key: "tv", label: "Televizor", Icon: Tv },
  { key: "router", label: "Router", Icon: Router },
  { key: "wifi", label: "Wi-Fi", Icon: Wifi },
  { key: "printer", label: "Printer", Icon: Printer },
  { key: "cable", label: "Kabel", Icon: Cable },
  { key: "usb", label: "USB", Icon: Usb },
  { key: "battery-charging", label: "Zaryadlovchi", Icon: BatteryCharging },
  { key: "plug", label: "Vilka", Icon: Plug },
  { key: "package", label: "Boshqa", Icon: Package },
];

export const ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);

/**
 * Categories seeded before this picker existed (0022_seed_categories.sql)
 * still have icon = null — this keeps their existing look on the admin
 * list until someone explicitly picks an icon for them, instead of every
 * pre-existing row suddenly showing a blank generic tag.
 */
export const LEGACY_SLUG_ICON: Record<string, string> = {
  telefonlar: "smartphone",
  noutbuklar: "laptop",
  quloqchinlar: "headphones",
  "kompyuter-aksessuarlari": "cpu",
  "smart-soatlar": "watch",
  kameralar: "camera",
};

/** Generic fallback for a category with no icon picked and no legacy match. */
export const DEFAULT_CATEGORY_ICON: LucideIcon = Tag;
