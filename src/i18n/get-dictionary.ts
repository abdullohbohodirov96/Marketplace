import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  uz: () => import("./dictionaries/uz.json").then((m) => m.default),
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  const loader = dictionaries[locale] ?? dictionaries.uz;
  return loader();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
