/**
 * Domain types — port of `domain/card.py`, `domain/reading.py`.
 *
 * The original Java card exposed `getCardId()` (used for the `card_%02d`
 * drawable lookup), `getName()`, `getMeaning()` and
 * `setDirect(boolean)` / `getReading()`. The same fields are kept here
 * so the port stays recognizable next to the Python/Java sources.
 */

export const SUITS = ["Wands", "Cups", "Swords", "Pentacles"] as const;
export type Suit = (typeof SUITS)[number];
export const ARCANA_MAJOR = "Major Arcana";

/** A single tarot card out of the 78-card deck (from tarot-deck.json). */
export interface Card {
  cardId: number; // 1..78 -> drawable "card_%02d" in the Android app
  name: string; // e.g. "The Fool", "Ace of Wands"
  arcana: string; // "Major Arcana" or one of SUITS
  rank: string; // roman numeral for majors, "Ace".."King" for minors
  keywords: string;
  meaning: string;
  upright: string;
  reversed: string;
}

export function cardImageRef(cardId: number): string {
  // Original drawable resource name, e.g. "card_07".
  return `card_${String(cardId).padStart(2, "0")}`;
}

export function isMajor(card: Card): boolean {
  return card.arcana === ARCANA_MAJOR;
}

export function suitOf(card: Card): Suit | null {
  return isMajor(card) ? null : (card.arcana as Suit);
}

export function orientationReading(card: Card, isReversed: boolean): string {
  return isReversed ? card.reversed : card.upright;
}

/** Port of the original `CardReadingType` enum. */
export enum CardReadingType {
  ONE_CARD = "ONE_CARD",
  THREE_CARD = "THREE_CARD",
  HORSESHOE = "HORSESHOE",
  CELTIC_CROSS = "CELTIC_CROSS",
  MIRROR = "MIRROR",
}

export const REVERSAL_CHANCE = 0.5; // half of the drawn cards may appear reversed

/** A card as it sits in a spread: orientation + flip state (SpreadCard). */
export interface SpreadCard {
  card: Card;
  isReversed: boolean;
  flipped: boolean;
  positionIndex: number;
}

export function orientationLabel(sc: SpreadCard): string {
  return sc.isReversed ? "Reversed" : "Upright";
}

/**
 * The in-progress reading (deck + dealt cards for one spread) — port of
 * `Reading`. The draw pile lives here too so the strip picker and the
 * Android `onResume()` lifecycle behave exactly as in the original.
 */
export interface Reading {
  readingType: CardReadingType;
  /** The shuffled draw pile (card ids in deal order). */
  pile: number[];
  spreadCards: SpreadCard[];
}
