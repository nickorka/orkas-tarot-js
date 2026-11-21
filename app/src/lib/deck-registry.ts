/**
 * Deck image registry — port of `domain/deck_images.py`.
 *
 * Decks live in `public/decks/`, one subfolder per deck. The subfolder
 * name (capitalized, e.g. `Parchment`, `Midnight`) is the deck's
 * display name in the sidebar selector.
 *
 * Naming convention: `[<prefix>_]<card id>_<card name>.<ext>`
 *  - `<card id>` is mandatory — the two-digit id (01 = The Fool …
 *    78 = King of Pentacles). Dashes are tolerated as separators.
 *  - `.jpg` / `.jpeg` / `.webp` / `.png` are accepted.
 *  - An optional `back` (or `card_back` / `cardback`) file supplies the
 *    deck's card-back design.
 *
 * Runs server-side only (uses `fs`).
 */
import "server-only";
import fs from "fs";
import path from "path";
import type { DeckInfo } from "./tarot/store";

export const PROJECT_DECKS_DIR = path.join(process.cwd(), "public", "decks");
export const DEFAULT_DECK = "Parchment";

const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

// deck-name keyword -> mock art style
const STYLE_HINTS: Array<[string[], string]> = [
  [["midnight", "dark", "noir", "gothic", "night"], "midnight"],
  [["botan", "forest", "green", "ivy", "herb"], "botanical"],
];

/** [<prefix>_]<id 2 digits>[_<name>] — spaces tolerated as separators. */
const FILENAME_RE = /^(?:([A-Za-z][\w.-]*?)_)?(\d{2})(?:_(.+))?$/i;

export function parseCardFilename(
  filename: string
): { prefix: string | null; cardId: number | null; slug: string | null } {
  const stem = path
    .basename(filename, path.extname(filename))
    .trim()
    .replace(/-/g, "_")
    .replace(/ /g, "_");
  const m = FILENAME_RE.exec(stem);
  if (!m) return { prefix: null, cardId: null, slug: null };
  const [, prefix, num, slug] = m;
  const cardId = parseInt(num, 10);
  if (!(cardId >= 1 && cardId <= 78)) return { prefix: null, cardId: null, slug: null };
  return {
    prefix: prefix ? prefix.toLowerCase() : null,
    cardId,
    slug: (slug || "").toLowerCase() || null,
  };
}

export function isCardBack(filename: string): boolean {
  const stem = path.basename(filename, path.extname(filename)).trim().toLowerCase();
  return ["back", "card_back", "cardback"].includes(stem);
}

/** Higher wins when two files claim the same id. */
function score(entry: { prefix: string | null; slug: string | null }): number {
  // prefer descriptive slug (bit 1), then prefix-less canonical file (bit 0)
  return (entry.slug ? 2 : 0) + (entry.prefix ? 0 : 1);
}

export function listDecks(): DeckInfo[] {
  if (!fs.existsSync(PROJECT_DECKS_DIR)) return [];
  const names = fs
    .readdirSync(PROJECT_DECKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();

  return names.map((name) => {
    const folder = path.join(PROJECT_DECKS_DIR, name);
    const cards: Record<number, string> = {};
    let best: Record<number, { prefix: string | null; slug: string | null }> = {};
    let back: string | null = null;
    for (const f of fs.readdirSync(folder).sort()) {
      const ext = path.extname(f).toLowerCase();
      if (!IMG_EXTS.has(ext)) continue;
      if (isCardBack(f)) {
        back = f;
        continue;
      }
      const parsed = parseCardFilename(f);
      if (parsed.cardId === null) continue;
      if (!(parsed.cardId in best) || score(parsed) > score(best[parsed.cardId])) {
        best[parsed.cardId] = parsed;
        cards[parsed.cardId] = f;
      }
    }
    return { name, coverage: Object.keys(cards).length, hasBack: back !== null, cards, back };
  });
}

/** Mock-art style picked from the deck's name (default: parchment). */
export function styleForDeck(deck: string | null | undefined): "parchment" | "midnight" | "botanical" {
  const name = (deck || "").toLowerCase();
  for (const [keywords, style] of STYLE_HINTS) {
    if (keywords.some((k) => name.includes(k))) return style as "midnight" | "botanical";
  }
  return "parchment";
}
