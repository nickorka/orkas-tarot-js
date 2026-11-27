"use client";
/**
 * Spread layout renderer — port of `components/spread_layout.py`.
 *
 * Every dealt card is a button whose background-image is the card's
 * artwork. Unflipped cards show the deck back (disabled button); flipped
 * cards show the face and open the detail modal on click. Layouts
 * single / row / arc / cross / mirror mirror the original grid
 * arrangements exactly.
 */
import { useState } from "react";
import type React from "react";
import { Spread } from "@/lib/tarot/spreads";
import { SpreadCard } from "@/lib/tarot/types";
import { useTarotStore } from "@/lib/tarot/store";
import { CardDetailModal } from "./card-modal";
import { useDeck, CardFacePlate, CardBack } from "./card-views";
import { useLocalCard, useT } from "@/lib/i18n/use-i18n";

export const CARD_W = 110;
export const CARD_H = 178;

interface SlotProps {
  sc: SpreadCard | undefined;
  index: number;
  posName: string;
  rotateDeg?: number;
  seqReveal: boolean;
}

function Slot({ sc, index, posName, rotateDeg = 0, seqReveal }: SlotProps) {
  const deck = useDeck();
  const t = useT();
  const localCard = useLocalCard();
  const [modal, setModal] = useState<SpreadCard | null>(null);

  if (!sc) {
    // Empty position placeholder
    return (
      <div className="card-slot" style={{ width: CARD_W, margin: "0 auto" }}>
        <div className="card-slot-empty">{index + 1}</div>
        <div className="pos-label">{posName}</div>
      </div>
    );
  }

  const styles: React.CSSProperties = {};
  let faceUrl: string | null = null;
  let backUrl: string | null = null;
  if (sc.flipped) {
    faceUrl = deck.faceUrl(sc.card.cardId);
    if (faceUrl) styles.backgroundImage = `url('${faceUrl}')`;
    if (sc.isReversed) styles.transform = `rotate(${rotateDeg + 180}deg)`;
    else if (rotateDeg) styles.transform = `rotate(${rotateDeg}deg)`;
    if (seqReveal) {
      styles.animation = `flipIn 500ms cubic-bezier(0.2,0.7,0.3,1)`;
      styles.animationDelay = `${index * 0.35}s`;
      styles.animationFillMode = "backwards";
    }
  } else {
    backUrl = deck.backUrl();
    if (backUrl) styles.backgroundImage = `url('${backUrl}')`;
    if (rotateDeg) styles.transform = `rotate(${rotateDeg}deg)`;
  }

  return (
    <div className="card-slot" style={{ width: CARD_W, margin: "0 auto" }}>
      <span className="pos-badge">{index + 1}</span>
      <button
        type="button"
        className={`card-btn size-spread ${sc.flipped ? "" : "cursor-default"}`}
        style={styles}
        disabled={!sc.flipped}
        aria-label={
          sc.flipped
            ? `${localCard(sc.card).name} (${t(sc.isReversed ? "card.reversed" : "card.upright")}) — ${posName}`
            : t("spread.faceDownAria", { n: index + 1, position: posName })
        }
        onClick={() => setModal(sc)}
      >
        {/* No deck artwork for this id: fall back to the mock plate inside the button */}
        {sc.flipped && !faceUrl ? (
          <CardFacePlate card={sc.card} size="spread" />
        ) : !sc.flipped && !backUrl ? (
          <CardBack size="spread" deckBackUrl={null} />
        ) : (
          <span>{localCard(sc.card).name}</span>
        )}
      </button>
      {sc.flipped && sc.isReversed ? <span className="reversed-badge">{t("card.reversed")}</span> : null}
      <div className={`pos-label ${sc.flipped ? "flipped" : ""}`}>{posName}</div>
      {modal ? (
        <CardDetailModal
          card={modal.card}
          isReversed={modal.isReversed}
          positionName={posName}
          open={!!modal}
          onOpenChange={(o) => {
            if (!o) setModal(null);
          }}
        />
      ) : null}
    </div>
  );
}

interface BoardProps {
  spread: Spread;
  spreadCards: SpreadCard[];
  seqReveal: boolean;
}

/** One slot cell sized like a column; empty cells keep the grid rhythm. */
function Cell({ children, grow = 1 }: { children: React.ReactNode; grow?: number }) {
  return <div style={{ flex: `${grow} 1 0%`, display: "flex", justifyContent: "center" }}>{children}</div>;
}

/** Fixed-width grid row used by the Celtic Cross board. */
function CrossRow({ cells }: { cells: React.ReactNode[] }) {
  const W = [1, 1, 0.7, 1, 1];
  return (
    <div className="flex" style={{ gap: 8 }}>
      {W.map((w, i) => (
        <Cell key={i} grow={w}>{cells[i]}</Cell>
      ))}
    </div>
  );
}

export function SpreadBoard({ spread, spreadCards, seqReveal }: BoardProps) {
  const t = useT();
  const at = (i: number) => spreadCards[i];
  const s = (i: number, rotateDeg = 0) => (
    <Slot
      sc={at(i)}
      index={i}
      posName={spread.positions[i].name}
      rotateDeg={rotateDeg}
      seqReveal={seqReveal}
    />
  );

  const allPlaced = spreadCards.length >= spread.cardCount;

  let body: React.ReactNode = null;
  if (spread.layout === "single") {
    body = (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Slot sc={at(0)} index={0} posName={spread.positions[0].name} seqReveal={seqReveal} />
      </div>
    );
  } else if (spread.layout === "row") {
    body = (
      <div className="spread-row flex flex-wrap justify-center" style={{ gap: 26 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: "0 1 auto" }}>
            {s(i)}
          </div>
        ))}
      </div>
    );
  } else if (spread.layout === "arc") {
    // Horseshoe: 5-column, 4-row grid forming a U shape (as the original).
    body = (
      <div className="flex flex-col" style={{ gap: 6 }}>
        <div className="flex" style={{ gap: 18 }}>
          <Cell>{s(0)}</Cell>
          <Cell /><Cell /><Cell />
          <Cell>{s(6)}</Cell>
        </div>
        <div className="flex" style={{ gap: 18 }}>
          <Cell>{s(1)}</Cell>
          <Cell /><Cell /><Cell />
          <Cell>{s(5)}</Cell>
        </div>
        <div className="flex" style={{ gap: 18 }}>
          <Cell /><Cell>{s(2)}</Cell><Cell />
          <Cell>{s(4)}</Cell>
          <Cell />
        </div>
        <div className="flex" style={{ gap: 18 }}>
          <Cell /><Cell /><Cell>{s(3)}</Cell><Cell /><Cell />
        </div>
      </div>
    );
  } else if (spread.layout === "cross") {
    // Celtic Cross: 5-column grid, 4 rows. Col widths [1,1,0.7,1,1].
    body = (
      <div className="flex flex-col" style={{ gap: 8 }}>
        <CrossRow cells={[null, s(4), null, null, s(6)]} />
        <CrossRow cells={[s(3), s(0), s(1, 90), s(5), s(7)]} />
        <CrossRow cells={[null, s(2), null, null, s(8)]} />
        <CrossRow cells={[null, null, null, null, s(9)]} />
      </div>
    );
  } else if (spread.layout === "mirror") {
    // Mirror: paired rows around a glass divider + key card.
    const leftIdx = new Map<number, number>();
    const rightIdx = new Map<number, number>();
    let keyIdx = 0;
    spread.positions.forEach((p, i) => {
      if (p.mirrorSide === "left") leftIdx.set(p.mirrorRow ?? 0, i);
      else if (p.mirrorSide === "right") rightIdx.set(p.mirrorRow ?? 0, i);
      else if (p.mirrorSide === "key") keyIdx = i;
    });
    const rows = [...leftIdx.keys()].sort((a, b) => a - b);
    body = (
      <div className="mirror-board">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center w-full" style={{ gap: 22 }}>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{s(leftIdx.get(row)!)}</div>
            <div className="mirror-glass" style={{ "--ch": `${CARD_H}px` } as React.CSSProperties} />
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>{s(rightIdx.get(row)!)}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>{s(keyIdx)}</div>
      </div>
    );
  }

  return (
    <div className="spread-board">
      {body}
      {!allPlaced ? (
        <p className="text-center text-sm italic text-[color:var(--ink-faint)] mt-2">
          {t("spread.selectMore", { count: spread.cardCount - spreadCards.length })}
        </p>
      ) : null}
    </div>
  );
}
