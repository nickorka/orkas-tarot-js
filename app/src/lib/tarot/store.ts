/**
 * Client state — port of `state.py` (Streamlit session_state).
 *
 * The Android app kept a global `TaroApplication` object holding the
 * current deck and reading; Streamlit used `st.session_state`. Here the
 * same role is played by a Zustand store, persisted to
 * sessionStorage so a browser refresh behaves like returning to the
 * same Streamlit session.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CardReadingType,
  Reading,
  SpreadCard,
} from "./types";
import {
  ensureReading,
  flipAll,
  getCardById,
  allFlipped as isAllFlipped,
  placeCard,
  rollReversed,
  shuffledPile,
} from "./deck";

export type ViewKey =
  | "home"
  | "one-card"
  | "three-card"
  | "horseshoe"
  | "celtic-cross"
  | "mirror"
  | "deck-browse"
  | "about";

export interface DeckInfo {
  name: string;
  coverage: number;
  hasBack: boolean;
  /** card id (1..78) -> served filename under /decks/<name>/ */
  cards: Record<number, string>;
  /** served filename of the deck back, or null */
  back: string | null;
}

interface TarotState {
  // view routing (st.navigation)
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // session state keys
  question: string;
  setQuestion: (q: string) => void;

  reading: Reading | null;
  lastFlipped: number | null;
  deckBrowseFilter: string;
  setDeckBrowseFilter: (f: string) => void;

  // shuffle widget state
  shufflePile: number[] | null;
  pickedIndices: number[];
  seqReveal: boolean;

  // deck artwork
  selectedDeck: string | null;
  setSelectedDeck: (d: string) => void;
  decks: DeckInfo[];
  setDecks: (d: DeckInfo[]) => void;

  debugLayout: boolean;
  setDebugLayout: (b: boolean) => void;

  // actions (ports of the Streamlit callbacks)
  enterSpread: (t: CardReadingType) => Reading;
  doShuffle: () => void;
  pickCard: (stripIndex: number, spreadCount: number) => void;
  reshuffleRedeal: () => void;
  clearSpread: () => void;
}

export const useTarotStore = create<TarotState>()(
  persist(
    (set, get) => ({
      view: "home",
      setView: (v) => set({ view: v }),

      question: "",
      setQuestion: (q) => set({ question: q }),

      reading: null,
      lastFlipped: null,
      deckBrowseFilter: "All",
      setDeckBrowseFilter: (f) => set({ deckBrowseFilter: f }),

      shufflePile: null,
      pickedIndices: [],
      seqReveal: false,

      selectedDeck: null,
      setSelectedDeck: (d) => set({ selectedDeck: d }),
      decks: [],
      setDecks: (d) => {
        set({ decks: d });
        // fallback selection when the saved deck disappeared
        const sel = get().selectedDeck;
        const names = d.map((x) => x.name);
        if (!sel || !names.includes(sel)) {
          const fallback = names.includes("Parchment") ? "Parchment" : names[0] ?? null;
          set({ selectedDeck: fallback });
        }
      },

      debugLayout: false,
      setDebugLayout: (b) => set({ debugLayout: b }),

      /** Port of `ensure_reading` — entering a spread (re)initialises it. */
      enterSpread: (t) => {
        const next = ensureReading(get().reading, t);
        if (next !== get().reading) {
          set({
            reading: next,
            lastFlipped: null,
            shufflePile: null,
            pickedIndices: [],
            seqReveal: false,
          });
        }
        return next!;
      },

      /** Port of `_render_initial`'s "Shuffle the deck" button. */
      doShuffle: () => {
        const reading = get().reading;
        if (!reading) return;
        const pile = shuffledPile();
        set({
          reading: { ...reading, pile },
          shufflePile: [...pile],
          pickedIndices: [],
          seqReveal: false,
        });
      },

      /**
       * Port of `_render_strip`'s pick handler: place the card face-down,
       * and when the last position fills, flip the whole spread with the
       * sequential reveal animation.
       */
      pickCard: (stripIndex, spreadCount) => {
        const { reading, shufflePile, pickedIndices } = get();
        if (!reading || !shufflePile) return;
        if (pickedIndices.includes(stripIndex)) return;
        const cardId = shufflePile[stripIndex];
        if (cardId == null || !getCardById(cardId)) return;
        const next = placeCard(reading, cardId, rollReversed());
        const picked = [...pickedIndices, stripIndex];
        if (next.spreadCards.length >= spreadCount) {
          set({
            reading: flipAll(next),
            pickedIndices: picked,
            seqReveal: true,
            shufflePile: null,
          });
        } else {
          set({ reading: next, pickedIndices: picked });
        }
      },

      /** Port of "Reshuffle" (picking phase) / "Reshuffle & redeal" (board phase). */
      reshuffleRedeal: () => {
        const reading = get().reading;
        if (!reading) return;
        const pile = shuffledPile();
        set({
          reading: {
            ...reading,
            spreadCards: [],
            pile,
          },
          shufflePile: [...pile],
          pickedIndices: [],
          lastFlipped: null,
          seqReveal: false,
        });
      },

      /** Port of "Clear" / "Clear spread" — back to the initial phase. */
      clearSpread: () => {
        const reading = get().reading;
        if (!reading) return;
        set({
          reading: { ...reading, spreadCards: [] },
          shufflePile: null,
          pickedIndices: [],
          lastFlipped: null,
          seqReveal: false,
        });
      },
    }),
    {
      name: "orkas-tarot-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        view: s.view,
        question: s.question,
        reading: s.reading,
        deckBrowseFilter: s.deckBrowseFilter,
        selectedDeck: s.selectedDeck,
        debugLayout: s.debugLayout,
        shufflePile: s.shufflePile,
        pickedIndices: s.pickedIndices,
        seqReveal: false,
      }),
    }
  )
);

/** Convenience selectors */
export const selectSpreadCards = (s: TarotState): SpreadCard[] => s.reading?.spreadCards ?? [];
export const selectAllFlipped = (s: TarotState): boolean =>
  s.reading ? isAllFlipped(s.reading) : false;
