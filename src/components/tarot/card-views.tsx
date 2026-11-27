"use client";
/**
 * Card rendering — port of `components/card_view.py` +
 * `domain/deck_images.py` data-URI resolution.
 *
 * The original resolved card images via `card_%02d` drawables, then via
 * the `decks/<DeckName>/` registry. Here the registry scan runs
 * server-side (see `src/lib/deck-registry.ts`) and the client builds
 * plain `/decks/<Deck>/<file>` URLs. Cards without real artwork fall
 * back to the parchment mock plate (numeral, emblem, name) in the
 * deck's art style.
 */
import { useMemo } from "react";
import { useTarotStore } from "@/lib/tarot/store";
import { styleForDeck } from "@/lib/deck-registry.client";
import { Card } from "@/lib/tarot/types";
import { useLocalCard, useT } from "@/lib/i18n/use-i18n";

export function useDeck(): {
  deckName: string | null;
  faceUrl: (cardId: number) => string | null;
  backUrl: () => string | null;
  coverage: number;
  hasBack: boolean;
} {
  const decks = useTarotStore((s) => s.decks);
  const selectedDeck = useTarotStore((s) => s.selectedDeck);

  return useMemo(() => {
    const info = decks.find((d) => d.name === selectedDeck) ?? null;
    return {
      deckName: selectedDeck,
      faceUrl: (cardId: number) =>
        info && info.cards[cardId] ? `/decks/${encodeURIComponent(info.name)}/${info.cards[cardId]}` : null,
      backUrl: () =>
        info && info.back ? `/decks/${encodeURIComponent(info.name)}/${info.back}` : null,
      coverage: info?.coverage ?? 0,
      hasBack: info?.hasBack ?? false,
    };
  }, [decks, selectedDeck]);
}

export const SUIT_COLORS: Record<string, string> = {
  "Major Arcana": "#7a2e22",
  Wands: "#8a3a2c",
  Cups: "#2c5a7a",
  Swords: "#4a5468",
  Pentacles: "#a87b2e",
};

/** Mock parchment plate — port of the CSS face fallback in card_view.py. */
export function CardFacePlate({ card: sourceCard, size }: { card: Card; size: "spread" | "detail" | "mini" }) {
  const deckName = useTarotStore((s) => s.selectedDeck);
  const card = useLocalCard()(sourceCard);
  const style = styleForDeck(deckName);
  const dims = size === "detail" ? { cw: 184, ch: 297 } : size === "mini" ? { cw: 96, ch: 155 } : { cw: 110, ch: 178 };
  // Colour and emblem follow the English arcana key; the label is localized.
  const suitColor = SUIT_COLORS[sourceCard.arcana] ?? "#7a2e22";
  const emblem = sourceCard.arcana === "Major Arcana" ? "✦" : (card.arcana[0] ?? "?").toUpperCase();

  return (
    <div
      className={`card-face ${style !== "parchment" ? `face-${style}` : ""}`}
      style={{ "--cw": `${dims.cw}px`, "--ch": `${dims.ch}px`, "--suit": suitColor } as React.CSSProperties}
    >
      <div className="face-numeral">{card.rank}</div>
      <div className="face-emblem">{emblem}</div>
      <div className="face-name">{card.name}</div>
    </div>
  );
}

/** Deck card-back (`back.png`) or the shared CSS burgundy back. */
export function CardBack({ size, deckBackUrl }: { size: "spread" | "detail" | "mini" | "stack"; deckBackUrl: string | null }) {
  const deckName = useTarotStore((s) => s.selectedDeck);
  const t = useT();
  const style = styleForDeck(deckName);
  const dims =
    size === "detail"
      ? { cw: 184, ch: 297 }
      : size === "mini"
        ? { cw: 96, ch: 155 }
        : size === "stack"
          ? { cw: 74, ch: 118 }
          : { cw: 110, ch: 178 };
  if (deckBackUrl) {
    return (
      <div
        className="card-back card-back-img"
        style={{ "--cw": `${dims.cw}px`, "--ch": `${dims.ch}px` } as React.CSSProperties}
      >
        <img src={deckBackUrl} alt={t("card.back")} />
      </div>
    );
  }
  return (
    <div
      className={`card-back ${style !== "parchment" ? `face-${style}` : ""}`}
      style={{ "--cw": `${dims.cw}px`, "--ch": `${dims.ch}px` } as React.CSSProperties}
    >
      <span className="back-corner tl">✧</span>
      <span className="back-corner br">✧</span>
      <div className="back-emblem">✦</div>
    </div>
  );
}

/** Full card face: deck artwork by card id, or the mock plate. */
export function CardFace({
  card,
  size,
  faceUrl,
}: {
  card: Card;
  size: "spread" | "detail" | "mini";
  faceUrl: string | null;
}) {
  const dims = size === "detail" ? { cw: 184, ch: 297 } : size === "mini" ? { cw: 96, ch: 155 } : { cw: 110, ch: 178 };
  const name = useLocalCard()(card).name;
  if (faceUrl) {
    return (
      <div
        className="card-face card-face-img"
        style={{ "--cw": `${dims.cw}px`, "--ch": `${dims.ch}px` } as React.CSSProperties}
      >
        <img src={faceUrl} alt={name} />
      </div>
    );
  }
  return <CardFacePlate card={card} size={size} />;
}
