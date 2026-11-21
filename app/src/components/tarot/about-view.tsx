"use client";
/**
 * About & Help — port of `views/about.py`.
 */
import { useTarotStore, ViewKey } from "@/lib/tarot/store";

const MAPPING: Array<[string, string]> = [
  ["TaroQuestionsActivity (launcher)", "Ask the Cards"],
  ["OneCardActivity", "One Card"],
  ["ThreeCardActivity", "Three Card"],
  ["HorseshoeActivity", "Horseshoe"],
  ["CelticCrossActivity", "Celtic Cross"],
  ["MirrorActivity", "Mirror"],
  ["CardActivity", "Card detail panels / Deck Browser"],
  ["DeckBrowseActivity", "Deck Browser"],
  ["ReadingActivity", "Full Reading Interpretation section"],
  ["Flip3dAnimation / SwapViews", "CSS flipIn keyframes (rotateY −90°→0°, 500 ms)"],
  ["AdActivity / TapForTapActivity", "— intentionally not ported —"],
];

const HOW_TO: Array<{ step: string; text: string; view?: ViewKey }> = [
  { step: "Ask a clear question", text: "on the Ask the Cards page — one focus, no double-barrelled questions.", view: "home" },
  { step: "Choose a spread", text: "from the sidebar menu. Entering a different spread reshuffles the deck, exactly as the original app did." },
  { step: "Shuffle & deal", text: "inside the reading panel. Half the drawn cards may appear reversed — the deck honours both polarities." },
  { step: "Turn the cards", text: "by picking them from the strip. Once the last position fills, the whole spread turns over in a sequential flip." },
  { step: "Read the interpretation", text: "that unfolds beneath the spread, position by position, ending with a synthesis of the deck's overall tone." },
];

export function AboutView() {
  const setView = useTarotStore((s) => s.setView);

  return (
    <div className="flex-1 flex flex-col">
      <div className="t-hero">
        <h1>About</h1>
        <div className="t-tagline">Orka&apos;s Tarot Pro — from Android to the web</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="t-panel">
        <p>
          <b>Orka&apos;s Tarot Pro</b> began life as an Android application
          (<i>com.orka.taropro</i>, v1.0.1) with five spreads, a browsable deck and a
          three-dimensional card flip animation. It was first ported to <b>Streamlit</b>,
          and this edition carries that port into <b>Node.js</b> (Next.js 16 + React +
          TypeScript): the same five spreads, the same 78-card deck with upright and
          reversed readings, and the same reading flow — ask a question, shuffle, deal
          face-down cards, turn them one by one, then read the full interpretation.
        </p>
        <p className="mt-3">
          The original card artwork and the Google Ads / TapForTap integrations were not
          part of the recovered sources; the ads are intentionally omitted, while the
          artwork is supplied through the <b>decks/</b> folder system — pick a deck in the
          sidebar and every card face is resolved from
          <i> decks/&lt;DeckName&gt;/[prefix_]NN_card_name.png</i> by its two-digit card id.
          Cards without a real image are drawn as generated mock plates (numeral, emblem
          and name in the deck&apos;s art style), and a deck may ship its own <i>back</i> card
          back.
        </p>
      </div>

      <h3 className="mt-6 mb-2">How to read the cards</h3>
      <div className="t-panel">
        <ol className="list-decimal ml-5 space-y-1.5">
          {HOW_TO.map((h, i) => (
            <li key={i}>
              {h.view ? (
                <button
                  type="button"
                  className="text-[color:var(--burgundy)] font-semibold underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
                  onClick={() => setView(h.view!)}
                >
                  <b>{h.step}</b>
                </button>
              ) : (
                <b>{h.step}</b>
              )}{" "}
              {h.text}
            </li>
          ))}
        </ol>
      </div>

      <h3 className="mt-6 mb-2">Android activity → page in this app</h3>
      <div className="t-panel">
        <table className="t-table">
          <thead>
            <tr style={{ fontFamily: "'Cinzel', Georgia, serif", color: "var(--burgundy-deep)" }}>
              <th>Android activity</th>
              <th>Page in this app</th>
            </tr>
          </thead>
          <tbody>
            {MAPPING.map(([a, b]) => (
              <tr key={a}>
                <td style={{ padding: "3px 4px" }}>{a}</td>
                <td style={{ padding: "3px 4px" }}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="t-footer">✦ The cards do not predict; they illuminate. ✦</div>
    </div>
  );
}
