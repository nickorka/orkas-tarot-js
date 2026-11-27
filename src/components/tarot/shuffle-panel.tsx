"use client";
/**
 * Shared deck shuffle widget — port of `components/shuffle_panel.py`.
 *
 * After shuffling, the full 78-card deck is displayed as a horizontal
 * scrollable strip of face-down cards. Clicking a card removes it from
 * the strip (replaced with a blank placeholder) and places it face-down
 * at the next open position in the reading. Once every position is
 * filled the strip disappears and the turn phase begins.
 */
import { useState } from "react";
import { Spread } from "@/lib/tarot/spreads";
import { useTarotStore } from "@/lib/tarot/store";
import { CardBack } from "./card-views";
import { useDeck } from "./card-views";
import { useToast } from "@/hooks/use-toast";
import { useLocalSpread, useT } from "@/lib/i18n/use-i18n";

/** Compact question editor shown inside the shuffle panel. */
function QuestionRow() {
  const t = useT();
  const question = useTarotStore((s) => s.question);
  const setQuestion = useTarotStore((s) => s.setQuestion);
  const [open, setOpen] = useState(question === "");
  const [draft, setDraft] = useState(question);
  const { toast } = useToast();

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex items-center gap-2 text-[0.95rem] font-semibold text-[color:var(--burgundy-deep)] font-[family-name:var(--font-cinzel)] cursor-pointer"
        style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-[color:var(--bronze)]">{open ? "▾" : "▸"}</span> {t("question.toggle")}
      </button>
      {open ? (
        <div className="mt-2">
          <textarea
            className="t-textarea w-full p-2 min-h-[72px]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("question.placeholder")}
            aria-label={t("question.aria")}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              className="t-btn t-btn-primary"
              onClick={() => {
                setQuestion(draft.trim());
                toast({ title: t("question.saved"), description: draft.trim() || t("question.cleared") });
              }}
            >
              {t("question.save")}
            </button>
            {question ? (
              <span className="italic text-[color:var(--ink-soft)] text-[0.95rem]">
                {t("question.current")} {question}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ShufflePanel({ spread: sourceSpread }: { spread: Spread }) {
  const t = useT();
  const spread = useLocalSpread(sourceSpread);
  const reading = useTarotStore((s) => s.reading);
  const shufflePile = useTarotStore((s) => s.shufflePile);
  const pickedIndices = useTarotStore((s) => s.pickedIndices);
  const doShuffle = useTarotStore((s) => s.doShuffle);
  const pickCard = useTarotStore((s) => s.pickCard);
  const reshuffleRedeal = useTarotStore((s) => s.reshuffleRedeal);
  const clearSpread = useTarotStore((s) => s.clearSpread);
  const deck = useDeck();

  if (!reading) return null;

  const allSelected = reading.spreadCards.length >= spread.cardCount;
  if (allSelected) return null;

  const back = deck.backUrl();
  const picked = new Set(pickedIndices);

  return (
    <div className="t-panel">
      <QuestionRow />

      {shufflePile === null ? (
        // -------------------------------------------- Phase 1 — before shuffle
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex justify-center shrink-0">
            <div className="deck-stack">
              <CardBack size="stack" deckBackUrl={back} />
              <CardBack size="stack" deckBackUrl={back} />
              <CardBack size="stack" deckBackUrl={back} />
              <div className="deck-count">
                <span className="n">78</span>
                <span className="u">{t("shuffle.cards")}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[1.05rem]">
              <b>{spread.title}</b> — {spread.tagline}.
              <br />
              {spread.description}
            </p>
            <p className="text-[color:var(--ink-faint)] text-[0.85rem] mt-1">
              {t("shuffle.deckInfo", { count: spread.cardCount })}
            </p>
            <button type="button" className="t-btn t-btn-primary mt-3" onClick={doShuffle}>
              {t("shuffle.shuffle")}
            </button>
          </div>
        </div>
      ) : (
        // ------------------------------- Phase 2 — picking from the strip
        <div>
          <p className="text-[1.02rem]">
            <b>{spread.title}</b> — {t("shuffle.selectN", { count: spread.cardCount })}
            <br />
            {t("shuffle.pickHint")}
          </p>
          <p className="text-[color:var(--ink-faint)] text-[0.85rem] mt-1">
            {t("shuffle.progress", {
              done: reading.spreadCards.length,
              total: spread.cardCount,
              left: spread.cardCount - reading.spreadCards.length,
            })}
          </p>
          <div className="flex gap-3 mt-3">
            <button type="button" className="t-btn" onClick={reshuffleRedeal}>
              {t("shuffle.reshuffle")}
            </button>
            <button type="button" className="t-btn" onClick={clearSpread}>
              {t("shuffle.clear")}
            </button>
          </div>
          <div className="shuffle-strip mt-3" role="listbox" aria-label={t("shuffle.strip")}>
            {shufflePile.map((cardId, i) =>
              picked.has(i) ? (
                <div key={i} className="shuffle-placeholder" aria-hidden="true" />
              ) : (
                <button
                  key={i}
                  type="button"
                  className="shuffle-card"
                  style={back ? { backgroundImage: `url('${back}')` } : undefined}
                  aria-label={t("shuffle.pickAria", { n: i + 1 })}
                  onClick={() => pickCard(i, spread.cardCount)}
                >
                  ✦
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
