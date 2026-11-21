/**
 * Card deck + reading lifecycle — port of `domain/deck.py`,
 * `domain/reading.py` and `state.py`.
 */
import deckJson from "@/data/tarot-deck.json";
import {
  Card,
  CardReadingType,
  Reading,
  REVERSAL_CHANCE,
  SpreadCard,
} from "./types";

/** The full 78-card deck in the original `card_%02d` id order. */
export const FULL_DECK: Card[] = deckJson as Card[];

const CARD_BY_ID = new Map<number, Card>(FULL_DECK.map((c) => [c.cardId, c]));

export function getCardById(id: number): Card | undefined {
  return CARD_BY_ID.get(id);
}

export const DECK_SIZE = FULL_DECK.length; // 78

/** Fisher–Yates shuffle (port of `CardDeck.shuffle()`). */
export function shuffledPile(): number[] {
  const pile = FULL_DECK.map((c) => c.cardId);
  for (let i = pile.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
  return pile;
}

/**
 * Port of the spread activities' `onResume()` reading check in
 * `state.ensure_reading`: a new reading (fresh shuffled deck) is created
 * when none exists or when the requested spread differs from the one in
 * progress — i.e. switching spreads reshuffles the deck.
 */
export function ensureReading(current: Reading | null, readingType: CardReadingType): Reading | null {
  if (current === null || current.readingType !== readingType) {
    return {
      readingType,
      pile: shuffledPile(),
      spreadCards: [],
    };
  }
  return current;
}

/** Deal-free placement: append one card at the next open position. */
export function placeCard(reading: Reading, cardId: number, isReversed: boolean): Reading {
  const idx = reading.spreadCards.length;
  const card = CARD_BY_ID.get(cardId);
  if (!card) return reading;
  const sc: SpreadCard = { card, isReversed, flipped: false, positionIndex: idx };
  return { ...reading, spreadCards: [...reading.spreadCards, sc] };
}

export function flipAll(reading: Reading): Reading {
  return {
    ...reading,
    spreadCards: reading.spreadCards.map((sc) => ({ ...sc, flipped: true })),
  };
}

export function allFlipped(reading: Reading): boolean {
  return reading.spreadCards.length > 0 && reading.spreadCards.every((sc) => sc.flipped);
}

export function rollReversed(): boolean {
  return Math.random() < REVERSAL_CHANCE;
}
