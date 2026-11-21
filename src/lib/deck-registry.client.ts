/** Client-safe subset of the deck registry helpers (no `fs`). */
export type DeckStyle = "parchment" | "midnight" | "botanical";

const STYLE_HINTS: Array<[string[], DeckStyle]> = [
  [["midnight", "dark", "noir", "gothic", "night"], "midnight"],
  [["botan", "forest", "green", "ivy", "herb"], "botanical"],
];

/** Mock-art style picked from the deck's name (default: parchment). */
export function styleForDeck(deck: string | null | undefined): DeckStyle {
  const name = (deck || "").toLowerCase();
  for (const [keywords, style] of STYLE_HINTS) {
    if (keywords.some((k) => name.includes(k))) return style;
  }
  return "parchment";
}
