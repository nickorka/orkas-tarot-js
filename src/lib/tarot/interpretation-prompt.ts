/**
 * Builds the prompt sent to the Snowflake tarot agent for the
 * "Interpretation" popup: the question plus, for every face-up card,
 * its role in the spread and its description from the reading.
 */
import { Spread } from "./spreads";
import { orientationReading, Reading } from "./types";

export function buildInterpretationPrompt(question: string, spread: Spread, reading: Reading): string {
  const cards = reading.spreadCards.filter((sc) => sc.flipped);
  if (cards.length === 0) throw new Error("Cannot build an interpretation prompt without a reading");

  const lines: string[] = [
    "You are interpreting a tarot reading. Answer the question strictly in the context of the reading below:",
    "use each card's role in the spread and its description to build one coherent interpretation.",
    "",
    `Question: ${question || "(no question asked — give a general reading)"}`,
    `Spread: ${spread.title} — ${spread.description}`,
    "",
  ];

  lines.push("Reading:");
  cards.forEach((sc, i) => {
    const pos = spread.positions[sc.positionIndex];
    lines.push(
      `${i + 1}. Position "${pos?.name ?? `Position ${sc.positionIndex + 1}`}"`,
      `   Role in the reading: ${pos?.description ?? "—"}`,
      `   Card: ${sc.card.name} (${sc.isReversed ? "reversed" : "upright"}), ${sc.card.arcana}`,
      `   Keywords: ${sc.card.keywords}`,
      `   Card description: ${sc.card.meaning}`,
      `   Meaning in this orientation: ${orientationReading(sc.card, sc.isReversed)}`
    );
  });

  lines.push(
    "",
    "Explain what each card says in its role, how the cards relate to each other,",
    "and close with a direct answer to the question."
  );
  return lines.join("\n");
}
