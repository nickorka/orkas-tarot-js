"use client";
/**
 * Full reading summary - port of `components/summary.py`
 * (`ReadingActivity` role): a position-by-position summary plus a
 * synthesis of Major Arcana weight and reversals once the spread is
 * complete. Rendered inside an expandable panel, expanded by default.
 *
 * The summary is built in English and translated into the selected
 * language; translations are cached per spread until it is cleared,
 * reshuffled or the question changes.
 */
import { useEffect, useState } from "react";
import { Spread } from "@/lib/tarot/spreads";
import { Reading } from "@/lib/tarot/types";
import { buildSummary } from "@/lib/tarot/summary";
import { useTarotStore } from "@/lib/tarot/store";
import { translateTexts, useLocalSpread, useT } from "@/lib/i18n/use-i18n";
import { SOURCE_LANGUAGE } from "@/lib/i18n/en";

export function SummaryPanel({ reading, spread }: { reading: Reading; spread: Spread }) {
  const t = useT();
  const local = useLocalSpread(spread);
  const question = useTarotStore((s) => s.question);
  const lang = useTarotStore((s) => s.language);
  const cached = useTarotStore((s) => s.summaryTranslations[spread.readingType]?.[lang]);
  const [open, setOpen] = useState(true);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const summary = buildSummary(reading, spread, question, new Date());

  // Flat list of the English dynamic texts, in a fixed order.
  const source = [
    summary.castLine,
    ...summary.positions.flatMap((p) => [p.heading, p.meta, p.body]),
    ...summary.tone,
    summary.closing,
  ];
  const sourceKey = JSON.stringify(source);
  const needsTranslation = lang !== SOURCE_LANGUAGE;
  const translated = needsTranslation && cached?.source === sourceKey ? cached.texts : null;
  const failed = failedKey === `${lang}|${sourceKey}`;

  useEffect(() => {
    if (!needsTranslation || translated || failed) return;
    const controller = new AbortController();
    translateTexts(JSON.parse(sourceKey), lang, controller.signal)
      .then((texts) =>
        useTarotStore.getState().setSummaryTranslation(spread.readingType, lang, { source: sourceKey, texts })
      )
      .catch(() => {
        if (!controller.signal.aborted) setFailedKey(`${lang}|${sourceKey}`);
      });
    return () => controller.abort();
  }, [needsTranslation, translated, failed, sourceKey, lang, spread.readingType]);

  const texts = translated ?? source;
  let i = 0;
  const castLine = texts[i++];
  const positions = summary.positions.map(() => ({ heading: texts[i++], meta: texts[i++], body: texts[i++] }));
  const tone = summary.tone.map(() => texts[i++]);
  const closing = texts[i++];
  const colon = closing.indexOf(":");

  return (
    <div>
      <div className="t-ornament">· · ✦ · ·</div>
      <div className="t-panel" style={{ padding: 0 }}>
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer"
          style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 700, color: "var(--burgundy-deep)" }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span>{t("summary.title")}</span>
          <span className="text-[color:var(--bronze)]">{open ? "▾" : "▸"}</span>
        </button>
        {open ? (
          <div className="t-summary px-5 pb-5 border-t border-[#e6d7b2]">
            {needsTranslation && !translated ? (
              <p className="italic text-[color:var(--ink-faint)] text-[0.85rem] mt-2" role="status">
                {failed ? t("app.translationFailed") : t("app.translating")}
              </p>
            ) : null}
            <h3 className="text-lg mt-3">{t("summary.reading", { spread: local.title })}</h3>
            {summary.question ? (
              <p className="italic">
                {t("summary.youAsked")} <b>{summary.question}</b>
              </p>
            ) : null}
            <p className="italic text-[color:var(--ink-soft)] text-[0.92rem]">{castLine}</p>

            <h4 className="mt-4">{t("summary.positions")}</h4>
            {positions.map((p, n) => (
              <p key={n}>
                <b>{p.heading}</b> <span className="italic text-[color:var(--ink-soft)]">{p.meta}</span>
                <br />
                {p.body}
              </p>
            ))}

            <h4 className="mt-4">{t("summary.shape")}</h4>
            {tone.map((line, n) => (
              <p key={n}>{line}</p>
            ))}

            <p className="mt-4">
              {colon > 0 ? (
                <>
                  <b>{closing.slice(0, colon)}</b>
                  {closing.slice(colon)}
                </>
              ) : (
                closing
              )}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
