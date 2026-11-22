"use client";
/**
 * Shared spread page flow — port of `components/spread_flow.py`.
 *
 * Every spread page (One Card, Three Card, Horseshoe, Celtic Cross,
 * Mirror) is a thin wrapper around this flow, exactly as each Android
 * spread activity was a thin subclass of `BaseSpreadActivity`.
 */
import { useEffect } from "react";
import { CardReadingType } from "@/lib/tarot/types";
import { getSpread } from "@/lib/tarot/spreads";
import { useTarotStore } from "@/lib/tarot/store";
import { ShufflePanel } from "./shuffle-panel";
import { SpreadBoard } from "./spread-board";
import { SummaryPanel } from "./summary-panel";
import { InterpretationButton } from "./interpretation-dialog";

export function SpreadView({ readingType }: { readingType: CardReadingType }) {
  const spread = getSpread(readingType);
  const reading = useTarotStore((s) => s.reading);
  const shufflePile = useTarotStore((s) => s.shufflePile);
  const seqReveal = useTarotStore((s) => s.seqReveal);
  const question = useTarotStore((s) => s.question);
  const enterSpread = useTarotStore((s) => s.enterSpread);

  // Port of ensure_reading: entering the page (re)initialises the reading;
  // switching to a different spread reshuffles the deck.
  useEffect(() => {
    enterSpread(readingType);
  }, [readingType, enterSpread]);

  // Clear the sequential-reveal flag after the animation has been applied,
  // mirroring st.session_state.pop("sequential_flip").
  useEffect(() => {
    if (seqReveal) {
      const t = setTimeout(() => useTarotStore.setState({ seqReveal: false }), spread.cardCount * 350 + 600);
      return () => clearTimeout(t);
    }
  }, [seqReveal, spread.cardCount]);

  const dealt = !!reading && reading.spreadCards.length > 0;
  const shownReading = reading?.readingType === readingType ? reading : null;

  return (
    <div>
      <div className="t-hero">
        <h1>{spread.title}</h1>
        <div className="t-tagline">{spread.tagline}</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      {shownReading ? <ShufflePanel spread={spread} /> : null}

      {question ? (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
          <div className="t-sub">&ldquo;{question}&rdquo;</div>
          <InterpretationButton question={question} spread={spread} reading={shownReading} />
        </div>
      ) : (
        <p className="text-center text-[0.88rem] italic text-[color:var(--ink-faint)] mt-3">
          No question has been asked yet — visit <i>Ask the Cards</i> in the menu,
          or set one inside the panel above. A focused question sharpens any reading.
        </p>
      )}

      <div className="t-ornament">· · ✦ · ·</div>

      {shownReading && dealt ? (
        <div>
          <SpreadBoard spread={spread} spreadCards={shownReading.spreadCards} seqReveal={seqReveal} />
          {shownReading.spreadCards.length >= spread.cardCount ? (
            <div>
              <div className="t-ornament">· · ✦ · ·</div>
              <div className="flex justify-center gap-4">
                <button type="button" className="t-btn" onClick={() => useTarotStore.getState().reshuffleRedeal()}>
                  Reshuffle &amp; redeal
                </button>
                <button type="button" className="t-btn" onClick={() => useTarotStore.getState().clearSpread()}>
                  Clear spread
                </button>
              </div>
              {shownReading.spreadCards.every((c) => c.flipped) ? (
                <SummaryPanel reading={shownReading} spread={spread} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : !(shufflePile && shownReading) ? (
        <div
          className="t-panel"
          style={{ textAlign: "center", fontStyle: "italic", color: "var(--ink-soft)" }}
        >
          The deck awaits. Shuffle the cards, then pick them one by one
          from the strip to build your reading.
        </div>
      ) : null}
    </div>
  );
}
