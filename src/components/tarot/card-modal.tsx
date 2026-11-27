"use client";
/**
 * Card detail modal — port of `CardActivity` / `show_card_modal` in
 * `components/card_view.py`: card image on top, orientation badge,
 * position panel, then name, keywords and the three reading sections.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CardBack, CardFace } from "./card-views";
import { useDeck } from "./card-views";
import { Card } from "@/lib/tarot/types";
import { useLocalCard, useT } from "@/lib/i18n/use-i18n";

export interface CardModalState {
  card: Card;
  isReversed: boolean;
  positionName?: string;
  positionDesc?: string;
}

export function CardDetailModal(props: CardModalState & { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { card: sourceCard, isReversed, positionName, positionDesc, open, onOpenChange } = props;
  const deck = useDeck();
  const t = useT();
  const card = useLocalCard()(sourceCard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="t-app bg-[linear-gradient(170deg,#fdf8ea_0%,#f6ecd0_70%,#efe0bc_100%)] border-[#c9b584] rounded-[14px] max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("card.detail")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("card.detailOf", { name: card.name })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div className="card-frame">
            <div className="card-inner">
              <CardFace card={sourceCard} size="detail" faceUrl={deck.faceUrl(card.cardId)} />
            </div>
          </div>
          <div className="mt-2">
            {isReversed ? (
              <span className="reversed-badge" style={{ position: "static", display: "inline-block" }}>
                {t("card.reversed")}
              </span>
            ) : (
              <span
                className="pos-label flipped"
                style={{ position: "static", display: "inline-block" }}
              >
                {t("card.upright")}
              </span>
            )}
          </div>
        </div>

        {positionName ? (
          <div className="t-panel mt-4 text-center">
            <b>{positionName}</b>
            <br />
            <span className="italic text-[color:var(--ink-soft)]">{positionDesc}</span>
          </div>
        ) : null}

        <div className="detail-text mt-4">
          <h3 className="text-xl">{card.name}</h3>
          <div className="detail-kw">
            {card.keywords} · {card.arcana}
          </div>
          <div className="detail-section">
            <div className="ds-title">{t("card.meaning")}</div>
            {card.meaning}
          </div>
          <div className="detail-section">
            <div className="ds-title">{t("card.uprightReading")}</div>
            {card.upright}
          </div>
          <div className="detail-section">
            <div className="ds-title">{t("card.reverseReading")}</div>
            {card.reversed}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Convenience wrapper: trigger = the card button content is supplied by the caller. */
export { DialogTrigger, CardBack };
