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

const FILTERS = ["All", "Major Arcana", "Wands", "Cups", "Swords", "Pentacles"];

export function DeckBrowserView() {
  const filter = useTarotStore((s) => s.deckBrowseFilter);
  const setFilter = useTarotStore((s) => s.setDeckBrowseFilter);
  const deck = useDeck();
  const [modalCard, setModalCard] = useState<Card | null>(null);

  const cards =
    filter === "All"
      ? FULL_DECK
      : filter === "Major Arcana"
        ? FULL_DECK.filter((c) => c.arcana === "Major Arcana")
        : FULL_DECK.filter((c) => c.arcana === filter);

  return (
    <div>
      <div className="t-hero">
        <h1>Deck Browser</h1>
        <div className="t-tagline">All seventy-eight cards, face up and at leisure</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter the deck">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            className={`t-btn ${filter === f ? "t-btn-primary" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-[color:var(--ink-faint)] text-[0.85rem] mt-2">
        {cards.length} cards shown · deck: {deck.deckName ?? "none"}
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
            aria-label={`View card ${c.name}`}
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
