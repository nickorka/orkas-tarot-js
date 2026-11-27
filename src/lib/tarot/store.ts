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
  Card,
  CardReadingType,
  Reading,
  SpreadCard,
} from "./types";
import type { LanguageBundle, LanguageInfo } from "@/lib/i18n/types";
import { ENGLISH } from "@/lib/i18n/types";
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

/** A spread's in-progress state, parked while another spread is open. */
export interface SavedSpread {
  reading: Reading;
  shufflePile: number[] | null;
  pickedIndices: number[];
}

/** Agent interpretation: created in English, translated per language on demand. */
export interface StoredInterpretation {
  en: string;
  tr: Record<string, string>;
}

/** Translations of a list of English texts; `source` is the JSON of those texts. */
export interface CachedTranslation {
  source: string;
  texts: string[];
}

/** Drops one spread's interpretation and translations (it was cleared / reshuffled). */
function withoutSpreadCaches(s: TarotState, t: CardReadingType) {
  const interpretations = { ...s.interpretations };
  const summaryTranslations = { ...s.summaryTranslations };
  delete interpretations[t];
  delete summaryTranslations[t];
  return { interpretations, summaryTranslations };
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

  /**
   * Per-spread memory: readings of spreads other than the current one, and
   * the agent interpretation of each spread's reading. Kept until the
   * spread is cleared / reshuffled or the question changes.
   */
  savedSpreads: Partial<Record<CardReadingType, SavedSpread>>;
  interpretations: Partial<Record<CardReadingType, StoredInterpretation>>;
  /** Stores the English interpretation (drops earlier translations). */
  setInterpretation: (t: CardReadingType, text: string) => void;
  setInterpretationTranslation: (t: CardReadingType, lang: string, text: string) => void;
  /** Translated summary texts per spread and language, keyed by their English source. */
  summaryTranslations: Partial<Record<CardReadingType, Record<string, CachedTranslation>>>;
  setSummaryTranslation: (t: CardReadingType, lang: string, value: CachedTranslation) => void;

  // localization: static UI texts + cards for the selected language
  language: string;
  setLanguage: (lang: string) => void;
  languages: LanguageInfo[];
  setLanguages: (l: LanguageInfo[]) => void;
  /** Loaded bundle for `language`; null for English (bundled texts are used). */
  bundle: { lang: string; ui: Record<string, string>; cards: Record<number, Card> } | null;
  setBundle: (lang: string, b: LanguageBundle) => void;

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
      // A new question invalidates every remembered reading and interpretation.
      setQuestion: (q) => {
        if (q === get().question) return;
        const reading = get().reading;
        set({
          question: q,
          savedSpreads: {},
          interpretations: {},
          summaryTranslations: {},
          reading: reading ? { ...reading, spreadCards: [] } : null,
          shufflePile: null,
          pickedIndices: [],
          lastFlipped: null,
          seqReveal: false,
        });
      },

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

      savedSpreads: {},
      interpretations: {},
      setInterpretation: (t, text) =>
        set({ interpretations: { ...get().interpretations, [t]: { en: text, tr: {} } } }),
      setInterpretationTranslation: (t, lang, text) => {
        const current = get().interpretations[t];
        if (!current) return;
        set({ interpretations: { ...get().interpretations, [t]: { ...current, tr: { ...current.tr, [lang]: text } } } });
      },
      summaryTranslations: {},
      setSummaryTranslation: (t, lang, value) =>
        set({
          summaryTranslations: {
            ...get().summaryTranslations,
            [t]: { ...get().summaryTranslations[t], [lang]: value },
          },
        }),

      language: ENGLISH.code,
      setLanguage: (lang) => set({ language: lang }),
      languages: [ENGLISH],
      setLanguages: (l) => set({ languages: l.length > 0 ? l : [ENGLISH] }),
      bundle: null,
      setBundle: (lang, b) =>
        set({ bundle: { lang, ui: b.ui, cards: Object.fromEntries(b.cards.map((c) => [c.cardId, c])) } }),

      /**
       * Port of `ensure_reading` — entering a spread restores its remembered
       * reading, or starts a fresh one. The spread being left is parked.
       */
      enterSpread: (t) => {
        const { reading, shufflePile, pickedIndices, savedSpreads } = get();
        if (reading && reading.readingType === t) return reading;
        const saved = { ...savedSpreads };
        if (reading) saved[reading.readingType] = { reading, shufflePile, pickedIndices };
        const restored = saved[t];
        delete saved[t];
        const next = restored?.reading ?? ensureReading(null, t)!;
        set({
          reading: next,
          savedSpreads: saved,
          lastFlipped: null,
          shufflePile: restored?.shufflePile ?? null,
          pickedIndices: restored?.pickedIndices ?? [],
          seqReveal: false,
        });
        return next;
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
          ...withoutSpreadCaches(get(), reading.readingType),
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
          ...withoutSpreadCaches(get(), reading.readingType),
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
        savedSpreads: s.savedSpreads,
        interpretations: s.interpretations,
        summaryTranslations: s.summaryTranslations,
        language: s.language,
        seqReveal: false,
      }),
      // Sessions saved before interpretations were per-language stored plain strings.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<TarotState>;
        const interpretations = Object.fromEntries(
          Object.entries(p.interpretations ?? {}).filter(([, v]) => v && typeof v === "object")
        );
        return { ...current, ...p, interpretations };
      },
    }
  )
);

/** Convenience selectors */
export const selectSpreadCards = (s: TarotState): SpreadCard[] => s.reading?.spreadCards ?? [];
export const selectAllFlipped = (s: TarotState): boolean =>
  s.reading ? isAllFlipped(s.reading) : false;
