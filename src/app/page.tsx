import { TarotApp } from "@/components/tarot/tarot-app";
import { listDecks } from "@/lib/deck-registry";

/**
 * Orka's Tarot Pro — Node.js edition (Next.js port of the Streamlit app).
 *
 * The deck registry scan (domain/deck_images.py) runs server-side once
 * per request; everything else — session state, shuffling, dealing,
 * flipping — lives in the client store, exactly where Streamlit's
 * session_state sat.
 */
export default function Page() {
  const decks = listDecks();
  return <TarotApp decks={decks} />;
}
