/**
 * Shared language-code validation and types for the i18n API routes.
 */
import type { Card } from "@/lib/tarot/types";

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

export interface LanguageBundle {
  ui: Record<string, string>;
  cards: Card[];
}

export const ENGLISH: LanguageInfo = { code: "en", name: "English", nativeName: "English" };

const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export function isLanguageCode(code: unknown): code is string {
  return typeof code === "string" && LANG_RE.test(code);
}
