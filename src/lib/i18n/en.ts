/**
 * English UI texts — the source of truth for every static UI id.
 *
 * The rows of TAROT.APP.UI_TEXT with LANGUAGE_CODE = 'en' are generated
 * from this file (scripts/generate-seed.ts); other languages are
 * translated from those rows. Missing translations fall back to the
 * text here. `{name}` placeholders are filled by `t(id, vars)`; texts
 * marked "markdown" are rendered with **bold** / *italic*.
 */
import { SPREADS } from "@/lib/tarot/spreads";

const STATIC: Record<string, string> = {
  // ---------------------------------------------------------------- app
  "app.name": "Orka's Tarot",
  "app.openMenu": "Open menu",
  "app.closeMenu": "Close menu",
  "app.sidebar": "Sidebar",
  "app.translating": "Translating…",
  "app.translationFailed": "Translation is unavailable right now — showing the English text.",

  // ---------------------------------------------------------------- nav
  "nav.home": "Ask the Cards",
  "nav.about": "About & Help",
  "nav.pages": "Pages",

  // ------------------------------------------------------------ sidebar
  "sidebar.language": "LANGUAGE",
  "sidebar.languageLabel": "Interface language",
  "sidebar.yourQuestion": "YOUR QUESTION",
  "sidebar.setQuestion": "Set your question first",
  "sidebar.cardDeck": "CARD DECK",
  "sidebar.deckStats1": "78 cards · 22 Major Arcana",
  "sidebar.deckStats2": "56 Minor Arcana · upright & reversed",
  "sidebar.artworkDeck": "Artwork deck",
  "sidebar.allIllustrated": "All 78 cards illustrated",
  "sidebar.backIncluded": " · back design included",
  "sidebar.partialIllustrated": "{count} of 78 cards illustrated — the rest are drawn as parchment plates.",
  "sidebar.noDecks": "No artwork decks are available — cards are drawn as simple parchment plates.",
  "sidebar.spreadMemory":
    "Each spread remembers its reading until you clear it, reshuffle it or change the question.",
  "sidebar.debugLayout": "Debug layout",

  // --------------------------------------------------------------- home
  "home.tagline": "Ask the cards — they answer those who ask clearly",
  // markdown
  "home.intro1":
    "Welcome, seeker. The ritual of **{app}** is simple: hold one question in your mind, " +
    "choose a spread, shuffle the seventy-eight cards, and turn each card by hand. Every card can be " +
    "read upright or reversed, alone or woven into the full interpretation that appears once the " +
    "spread is complete.",
  "home.intro2":
    "A clear question is the single most important card on the table. Vague questions invite " +
    "vague answers; name what you truly want to know, and choose the spread that fits its weight.",
  "home.yourQuestion": "Your question",
  "home.placeholder": "e.g. What should I know about the path I am currently on?",
  "home.questionAria": "Focus your mind on a single question.",
  "home.savedQuestion": "Saved question:",
  "home.needStart": "Need a starting point?",
  "home.sample1": "What should I focus on this month?",
  "home.sample2": "What does my heart need right now?",
  "home.sample3": "How is my career truly unfolding?",
  "home.chooseSpread": "Choose your spread",
  "home.blurb.ONE_CARD": "A single focused answer — daily guidance, quick clarity.",
  "home.blurb.THREE_CARD": "Past, present, future — the classic narrative arc.",
  "home.blurb.HORSESHOE": "Seven cards in a lucky arc — a rounded situation reading.",
  "home.blurb.CELTIC_CROSS": "The famous ten-card spread for weighty questions.",
  "home.blurb.MIRROR": "Eleven cards across the glass — self-knowledge and reflection.",
  "home.footer": "✦ {app} ✦",

  // ----------------------------------------------------------- question
  "question.save": "Save question",
  "question.saved": "Question saved",
  "question.cleared": "(cleared)",
  "question.toggle": "Your question",
  "question.placeholder": "e.g. What should I focus on in my career this season?",
  "question.aria": "Focus your mind on a single question — the cards answer best to clarity.",
  "question.current": "Current question:",

  // ------------------------------------------------------------ shuffle
  "shuffle.cards": "CARDS",
  "shuffle.deckInfo": "78-card deck · {count} cards to select",
  "shuffle.shuffle": "Shuffle the deck",
  "shuffle.selectN": "select {count} cards from the deck.",
  "shuffle.pickHint": "Pick a card from the strip below to place it in the reading.",
  "shuffle.progress": "{done} of {total} cards selected · {left} remaining",
  "shuffle.reshuffle": "Reshuffle",
  "shuffle.clear": "Clear",
  "shuffle.strip": "Deck strip — pick a card",
  "shuffle.pickAria": "Pick face-down card {n}",

  // ------------------------------------------------------------- spread
  "spread.noQuestion":
    "No question has been asked yet — visit *Ask the Cards* in the menu, or set one inside the " +
    "panel above. A focused question sharpens any reading.",
  "spread.deckAwaits":
    "The deck awaits. Shuffle the cards, then pick them one by one from the strip to build your reading.",
  "spread.reshuffleRedeal": "Reshuffle & redeal",
  "spread.clearSpread": "Clear spread",
  "spread.selectMore": "Select {count} more card(s) from the deck below.",
  "spread.faceDownAria": "Face-down card {n} — {position}",

  // --------------------------------------------------------------- card
  "card.upright": "Upright",
  "card.reversed": "Reversed",
  "card.detail": "Card Detail",
  "card.detailOf": "Detail of the tarot card {name}",
  "card.meaning": "Card Meaning:",
  "card.uprightReading": "Upright Reading:",
  "card.reverseReading": "Reverse Reading:",
  "card.back": "card back",
  "card.view": "View card {name}",

  // ------------------------------------------------------------- arcana
  "arcana.All": "All",
  "arcana.Major Arcana": "Major Arcana",
  "arcana.Wands": "Wands",
  "arcana.Cups": "Cups",
  "arcana.Swords": "Swords",
  "arcana.Pentacles": "Pentacles",

  // --------------------------------------------------------------- deck
  "deck.title": "Deck Browser",
  "deck.tagline": "All seventy-eight cards, face up and at leisure",
  "deck.filter": "Filter the deck",
  "deck.shown": "{count} cards shown · deck: {deck}",
  "deck.none": "none",

  // ------------------------------------------------------------ summary
  "summary.title": "Full Reading Interpretation",
  "summary.reading": "The {spread} Reading",
  "summary.youAsked": "You asked:",
  "summary.positions": "The cards, position by position",
  "summary.shape": "The shape of the reading",

  // ----------------------------------------------------- interpretation
  "interp.button": "Interpretation",
  "interp.disabled": "Deal and reveal all cards of the spread first",
  "interp.title": "{spread} — Interpretation",
  "interp.loading": "Consulting the cards…",
  "interp.retry": "Try again",
  "interp.empty": "The agent returned no interpretation.",

  // -------------------------------------------------------------- about
  "about.title": "About",
  "about.tagline": "A quiet companion for reading the cards",
  // markdown
  "about.p1":
    "**{app}** offers five spreads, from a single card to the eleven-card Mirror, and the " +
    "full 78-card deck with upright and reversed readings. The reading flow follows the ritual: ask a " +
    "question, shuffle, deal face-down cards, turn them over, then read the full interpretation.",
  "about.p2":
    "Pick an artwork deck in the sidebar to change how the cards look. Cards without artwork in the " +
    "chosen deck are drawn as simple parchment plates showing their numeral, emblem and name.",
  "about.howTo": "How to read the cards",
  "about.step1": "Ask a clear question",
  "about.step1Text": "on the Ask the Cards page — one focus, no double-barrelled questions.",
  "about.step2": "Choose a spread",
  "about.step2Text": "from the sidebar menu. Each spread keeps its own reading while you move between them.",
  "about.step3": "Shuffle & deal",
  "about.step3Text": "inside the reading panel. Half the drawn cards may appear reversed — the deck honours both polarities.",
  "about.step4": "Turn the cards",
  "about.step4Text": "by picking them from the strip. Once the last position fills, the whole spread turns over in a sequential flip.",
  "about.step5": "Read the interpretation",
  "about.step5Text":
    "that unfolds beneath the spread, position by position, ending with a synthesis of the deck's overall tone.",
  "about.footer": "✦ The cards do not predict; they illuminate. ✦",
};

/** Spread titles, taglines, descriptions and position roles from spreads.ts. */
const SPREAD_TEXTS: Record<string, string> = Object.fromEntries(
  Object.values(SPREADS).flatMap((s) => [
    [`spread.${s.readingType}.title`, s.title],
    [`spread.${s.readingType}.tagline`, s.tagline],
    [`spread.${s.readingType}.description`, s.description],
    ...s.positions.flatMap((p) => [
      [`spread.${s.readingType}.pos.${p.index}.name`, p.name],
      [`spread.${s.readingType}.pos.${p.index}.description`, p.description],
    ]),
  ])
);

export const EN_UI: Record<string, string> = { ...STATIC, ...SPREAD_TEXTS };

export const SOURCE_LANGUAGE = "en";

/** The app's name; never translated. Other texts refer to it as `{app}`. */
export const APP_NAME = EN_UI["app.name"];

/** UI ids that are never translated (keep in sync with translate_language.sql). */
export const UNTRANSLATED_IDS = ["app.name"];
