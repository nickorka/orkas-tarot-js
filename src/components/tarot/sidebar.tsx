"use client";
/**
 * Sidebar — port of app.py's sidebar (the web replacement for the
 * Android launcher menu): brand, question display, deck artwork
 * selector, coverage captions and the debug toggle, plus the
 * st.navigation page menu.
 */
import { useTarotStore, ViewKey } from "@/lib/tarot/store";
import { useMemo } from "react";

const NAV: Array<{ view: ViewKey; label: string; icon: string }> = [
  { view: "home", label: "Ask the Cards", icon: "✦" },
  { view: "one-card", label: "One Card", icon: "①" },
  { view: "three-card", label: "Three Card", icon: "③" },
  { view: "horseshoe", label: "Horseshoe", icon: "⌒" },
  { view: "celtic-cross", label: "Celtic Cross", icon: "✚" },
  { view: "mirror", label: "Mirror", icon: "◫" },
  { view: "deck-browse", label: "Deck Browser", icon: "♤" },
  { view: "about", label: "About & Help", icon: "ⓘ" },
];

export function SidebarContent() {
  const view = useTarotStore((s) => s.view);
  const setView = useTarotStore((s) => s.setView);
  const question = useTarotStore((s) => s.question);
  const decks = useTarotStore((s) => s.decks);
  const selectedDeck = useTarotStore((s) => s.selectedDeck);
  const setSelectedDeck = useTarotStore((s) => s.setSelectedDeck);
  const debugLayout = useTarotStore((s) => s.debugLayout);
  const setDebugLayout = useTarotStore((s) => s.setDebugLayout);

  const selectedInfo = useMemo(
    () => decks.find((d) => d.name === selectedDeck) ?? null,
    [decks, selectedDeck]
  );

  return (
    <div className="flex flex-col h-full">
      {/* brand */}
      <div className="px-4 pt-5 pb-1 text-center">
        <div className="side-brand text-[1.06rem] leading-tight">
          <span className="star">✦</span>
          <br />
          Orka&apos;s Tarot Pro
          <br />
          <span className="font-normal italic text-[0.8rem] text-[color:var(--ink-soft)]">Node.js edition</span>
        </div>
        <div className="t-ornament" style={{ letterSpacing: "0.35em", margin: "0.5rem 0 0.2rem" }}>
          · · ✦ · ·
        </div>
      </div>

      {/* navigation menu (st.navigation) */}
      <nav className="px-3 space-y-1" aria-label="Pages">
        {NAV.map((n) => (
          <button
            key={n.view}
            type="button"
            className={`t-nav-item ${view === n.view ? "active" : ""}`}
            onClick={() => setView(n.view)}
            aria-current={view === n.view ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="t-ornament" style={{ letterSpacing: "0.35em", margin: "0.8rem 0 0.4rem" }}>
        · · ✦ · ·
      </div>

      {/* question */}
      <div className="px-4">
        {question ? (
          <div>
            <div className="t-side-heading">YOUR QUESTION</div>
            <div className="t-side-quote mt-1 text-[0.92rem]">&ldquo;{question}&rdquo;</div>
          </div>
        ) : (
          <button
            type="button"
            className="t-nav-item italic text-[color:var(--burgundy)]"
            onClick={() => setView("home")}
          >
            <span className="nav-icon">✎</span> Set your question first
          </button>
        )}
      </div>

      {/* deck info */}
      <div className="px-4 mt-4">
        <div className="t-side-heading">CARD DECK</div>
        <div className="t-side-caption mt-1">
          78 cards · 22 Major Arcana
          <br />
          56 Minor Arcana · upright &amp; reversed
        </div>

        {decks.length > 0 ? (
          <div className="mt-2">
            <select
              className="t-select w-full px-2 py-1.5 cursor-pointer"
              value={selectedDeck ?? ""}
              onChange={(e) => setSelectedDeck(e.target.value)}
              aria-label="Artwork deck"
            >
              {decks.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {selectedInfo ? (
              <p className="t-side-caption mt-1.5">
                {selectedInfo.coverage >= 78 ? (
                  <>
                    All 78 cards illustrated
                    {selectedInfo.hasBack ? " · back design included" : ""}
                  </>
                ) : (
                  <>
                    {selectedInfo.coverage} of 78 cards illustrated — the rest use the
                    built-in mock art.
                  </>
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="t-side-caption mt-2">
            No decks found in ./decks — cards fall back to the built-in mock parchment
            plates.
          </p>
        )}

        <p className="t-side-caption mt-3">
          Switching between spreads reshuffles the deck — just as the original Android
          app did.
        </p>
      </div>

      <div className="t-ornament" style={{ letterSpacing: "0.35em", margin: "0.8rem 0 0.4rem" }}>
        · · ✦ · ·
      </div>

      {/* debug */}
      <label className="px-4 pb-5 flex items-center gap-2 cursor-pointer text-[0.9rem]">
        <input
          type="checkbox"
          checked={debugLayout}
          onChange={(e) => setDebugLayout(e.target.checked)}
          className="accent-[#7a2e22] w-4 h-4"
        />
        Debug layout
      </label>
    </div>
  );
}
