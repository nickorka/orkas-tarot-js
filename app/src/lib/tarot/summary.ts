/**
 * Full reading summary — port of `components/summary.py`.
 *
 * Once every card in the spread is face up, this weaves the position
 * meanings and card interpretations into one flowing, position-by-
 * position interpretation, closes with a synthesis of the deck's tone
 * (how many Major Arcana, how many reversals) and the advice of the
 * final card.
 */
import { Card, orientationReading, Reading } from "./types";
import { Spread } from "./spreads";

function orientationPhrase(isReversed: boolean): string {
  return isReversed ? "falls reversed" : "stands upright";
}

export interface SummaryBlock {
  heading: string; // e.g. "1. The Past — The Fool"
  meta: string; // "(stands upright)."
  body: string;
}

export interface ReadingSummary {
  question: string;
  castLine: string;
  positions: SummaryBlock[];
  tone: string[];
  closing: string;
}

export function buildSummary(
  reading: Reading,
  spread: Spread,
  question: string,
  castDate: Date
): ReadingSummary {
  // ------------------------------------------------- position by position
  const positions: SummaryBlock[] = reading.spreadCards.map((sc, i) => {
    const pos = spread.positions[i];
    const orientation = orientationPhrase(sc.isReversed);
    const interpretation = orientationReading(sc.card, sc.isReversed);
    const firstKeyword = sc.card.keywords.split("·")[0].trim().toLowerCase();
    return {
      heading: `${i + 1}. ${pos.name} — ${sc.card.name}`,
      meta: `(${orientation}).`,
      body: `${pos.description} Here, ${sc.card.name} speaks of ${firstKeyword}: ${interpretation}`,
    };
  });

  // --------------------------------------------------------- synthesis
  const majors = reading.spreadCards.filter((sc) => sc.card.arcana === "Major Arcana");
  const reversals = reading.spreadCards.filter((sc) => sc.isReversed);

  let tone: string;
  if (majors.length >= spread.cardCount / 2) {
    tone =
      "Fate dominates this cast — more than half the cards are Major Arcana, " +
      "so the situation is being driven by forces larger than daily habit. " +
      "Work with the current rather than against it.";
  } else if (majors.length > 0) {
    tone =
      `${majors.length} Major Arcana anchor the cast while the remaining ` +
      `minor cards fill in the everyday detail: destiny sets the theme, ` +
      `but your daily choices still steer the road.`;
  } else {
    tone =
      "No Major Arcana appear — this is a reading of the everyday, where " +
      "ordinary decisions, habits and conversations carry the outcome.";
  }

  const toneParts: string[] = [tone];

  if (reversals.length >= spread.cardCount / 2 && spread.cardCount > 1) {
    toneParts.push(
      "Half or more of the cards arrive reversed: much of this matter is " +
        "internal — resistance, delays and unwritten feelings. Progress " +
        "begins with honest inner work before outer action."
    );
  } else if (reversals.length > 0) {
    toneParts.push(
      `${reversals.length} of ${spread.cardCount} cards are reversed, ` +
        "marking the corners of the situation where energy is held back or " +
        "turned inward; treat those positions with extra patience."
    );
  } else if (spread.cardCount > 1) {
    toneParts.push(
      "Every card stands upright: the energy of the matter flows " +
        "outward and unblocked — a good moment to act."
    );
  }

  // ------------------------------------------------------ final advice
  const finalSc: Card = reading.spreadCards[reading.spreadCards.length - 1].card;
  const finalIsReversed = reading.spreadCards[reading.spreadCards.length - 1].isReversed;
  const finalPos = spread.positions[spread.positions.length - 1];
  const closing =
    `In closing, ${finalPos.name} — the ${finalSc.name} ` +
    `${orientationPhrase(finalIsReversed)}: ` +
    `${orientationReading(finalSc, finalIsReversed)}`;

  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const castLine =
    `Cast on ${monthNames[castDate.getMonth()]} ${String(castDate.getDate()).padStart(2, "0")}, ${castDate.getFullYear()}` +
    ` · spread: ${spread.title} (${spread.cardCount} card${spread.cardCount !== 1 ? "s" : ""})`;

  return { question, castLine, positions, tone: toneParts, closing };
}
