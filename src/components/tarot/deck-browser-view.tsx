"use client";
/**
 * Deck Browser — port of `DeckBrowseActivity` in `views/deck_browse.py`.
 *
 * All seventy-eight cards displayed as clickable image buttons.
 * Tapping any card opens the detail modal.
 */
import { useState } from "react";
import { FULL_DECK } from "@/lib/tarot/deck";
import { Card } from "@/lib/tarot/types";
import { useTarotStore } from "@/lib/tarot/store";
import { useDeck, CardFace } from "./card-views";
import { CardDetailModal } from "./card-modal";
import { useLocalCard, useT } from "@/lib/i18n/use-i18n";

// Filter keys are the English arcana values; labels come from `arcana.<key>`.
const FILTERS = ["All", "Major Arcana", "Wands", "Cups", "Swords", "Pentacles"];

export function DeckBrowserView() {
  const t = useT();
  const localCard = useLocalCard();
  const filter = useTarotStore((s) => s.deckBrowseFilter);
  const setFilter = useTarotStore((s) => s.setDeckBrowseFilter);
  const deck = useDeck();
  const [modalCard, setModalCard] = useState<Card | null>(null);

  const cards = filter === "All" ? FULL_DECK : FULL_DECK.filter((c) => c.arcana === filter);

  return (
    <div>
      <div className="t-hero">
        <h1>{t("deck.title")}</h1>
        <div className="t-tagline">{t("deck.tagline")}</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("deck.filter")}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            className={`t-btn ${filter === f ? "t-btn-primary" : ""}`}
            onClick={() => setFilter(f)}
          >
            {t(`arcana.${f}`)}
          </button>
        ))}
      </div>

      <p className="text-[color:var(--ink-faint)] text-[0.85rem] mt-2">
        {t("deck.shown", { count: cards.length, deck: deck.deckName ?? t("deck.none") })}
      </p>

      <div
        className="grid gap-x-4 gap-y-6 mt-4 justify-center"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
      >
        {cards.map((c) => (
          <button
            key={c.cardId}
            type="button"
            className="mx-auto transition-transform duration-200 hover:-translate-y-1 hover:drop-shadow-[0_6px_14px_rgba(122,46,34,0.35)]"
            aria-label={t("card.view", { name: localCard(c).name })}
            onClick={() => setModalCard(c)}
          >
            <CardFace card={c} size="mini" faceUrl={deck.faceUrl(c.cardId)} />
          </button>
        ))}
      </div>

      {modalCard ? (
        <CardDetailModal
          card={modalCard}
          isReversed={false}
          open={!!modalCard}
          onOpenChange={(o) => {
            if (!o) setModalCard(null);
          }}
        />
      ) : null}
    </div>
  );
}
