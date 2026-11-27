"use client";
/**
 * Client-side localization hooks.
 *
 * Static texts come from the selected language's bundle (TAROT.APP.UI_TEXT
 * / TAROT.APP.CARDS via /api/i18n) and fall back to the bundled English
 * texts. Readings always keep the English cards and spreads — prompts and
 * summaries are built in English and translated afterwards — so these
 * hooks only localize what is displayed.
 */
import { useCallback, useEffect } from "react";
import { useTarotStore } from "@/lib/tarot/store";
import { Card } from "@/lib/tarot/types";
import { Spread } from "@/lib/tarot/spreads";
import { APP_NAME, EN_UI, SOURCE_LANGUAGE, UNTRANSLATED_IDS } from "./en";
import type { LanguageBundle, LanguageInfo } from "./types";

export type TFunction = (id: string, vars?: Record<string, string | number>) => string;

function format(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** The bundle of the selected language, or null while English / not loaded. */
function useActiveBundle() {
  const language = useTarotStore((s) => s.language);
  const bundle = useTarotStore((s) => s.bundle);
  return bundle && bundle.lang === language ? bundle : null;
}

export function useT(): TFunction {
  const bundle = useActiveBundle();
  return useCallback(
    (id, vars) =>
      format(UNTRANSLATED_IDS.includes(id) ? EN_UI[id] : bundle?.ui[id] ?? EN_UI[id] ?? id, {
        app: APP_NAME,
        ...vars,
      }),
    [bundle]
  );
}

/** Maps an (English) card to its definition in the selected language. */
export function useLocalCard(): (card: Card) => Card {
  const bundle = useActiveBundle();
  return useCallback((card) => bundle?.cards[card.cardId] ?? card, [bundle]);
}

/** Spread with localized title, tagline, description and position roles. */
export function useLocalSpread(spread: Spread): Spread {
  const t = useT();
  const k = `spread.${spread.readingType}`;
  return {
    ...spread,
    title: t(`${k}.title`),
    tagline: t(`${k}.tagline`),
    description: t(`${k}.description`),
    positions: spread.positions.map((p) => ({
      ...p,
      name: t(`${k}.pos.${p.index}.name`),
      description: t(`${k}.pos.${p.index}.description`),
    })),
  };
}

/** Loads the language list once and the bundle whenever the language changes. */
export function useLanguageLoader(): void {
  const language = useTarotStore((s) => s.language);
  const bundle = useTarotStore((s) => s.bundle);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((d: { languages?: LanguageInfo[] }) => useTarotStore.getState().setLanguages(d.languages ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (language === SOURCE_LANGUAGE || bundle?.lang === language) return;
    const controller = new AbortController();
    fetch(`/api/i18n?lang=${encodeURIComponent(language)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`i18n ${r.status}`))))
      .then((b: LanguageBundle) => useTarotStore.getState().setBundle(language, b))
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Loading translations failed:", err);
      });
    return () => controller.abort();
  }, [language, bundle?.lang]);
}

/** Translates English dynamic texts into `lang` (English is returned as is). */
export async function translateTexts(texts: string[], lang: string, signal?: AbortSignal): Promise<string[]> {
  if (lang === SOURCE_LANGUAGE) return texts;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, lang }),
    signal,
  });
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.texts)) throw new Error(data.error ?? `Translation failed (${res.status})`);
  return data.texts;
}
