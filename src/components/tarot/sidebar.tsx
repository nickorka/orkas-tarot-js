"use client";
/**
 * Sidebar — port of app.py's sidebar (the web replacement for the
 * Android launcher menu): brand, language picker, question display, deck
 * artwork selector, coverage captions and the debug toggle, plus the
 * st.navigation page menu.
 */
import { useTarotStore, ViewKey } from "@/lib/tarot/store";
import { useMemo } from "react";
import { useT } from "@/lib/i18n/use-i18n";

// Labels reuse the page-title ids so each page has one translated name.
const NAV: Array<{ view: ViewKey; label: string; icon: string }> = [
  { view: "home", label: "nav.home", icon: "✦" },
  { view: "one-card", label: "spread.ONE_CARD.title", icon: "①" },
  { view: "three-card", label: "spread.THREE_CARD.title", icon: "③" },
  { view: "horseshoe", label: "spread.HORSESHOE.title", icon: "⌒" },
  { view: "celtic-cross", label: "spread.CELTIC_CROSS.title", icon: "✚" },
  { view: "mirror", label: "spread.MIRROR.title", icon: "◫" },
  { view: "deck-browse", label: "deck.title", icon: "♤" },
  { view: "about", label: "nav.about", icon: "ⓘ" },
];

export function SidebarContent() {
  const t = useT();
  const view = useTarotStore((s) => s.view);
  const setView = useTarotStore((s) => s.setView);
  const question = useTarotStore((s) => s.question);
  const decks = useTarotStore((s) => s.decks);
  const selectedDeck = useTarotStore((s) => s.selectedDeck);
  const setSelectedDeck = useTarotStore((s) => s.setSelectedDeck);
  const debugLayout = useTarotStore((s) => s.debugLayout);
  const setDebugLayout = useTarotStore((s) => s.setDebugLayout);
  const language = useTarotStore((s) => s.language);
  const setLanguage = useTarotStore((s) => s.setLanguage);
  const languages = useTarotStore((s) => s.languages);

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
          {t("app.name")}
        </div>
        <div className="t-ornament" style={{ letterSpacing: "0.35em", margin: "0.5rem 0 0.2rem" }}>
          · · ✦ · ·
        </div>
      </div>

      {/* navigation menu (st.navigation) */}
      <nav className="px-3 space-y-1" aria-label={t("nav.pages")}>
        {NAV.map((n) => (
          <button
            key={n.view}
            type="button"
            className={`t-nav-item ${view === n.view ? "active" : ""}`}
            onClick={() => setView(n.view)}
            aria-current={view === n.view ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{n.icon}</span>
            {t(n.label)}
          </button>
        ))}
      </nav>

      <div className="t-ornament" style={{ letterSpacing: "0.35em", margin: "0.8rem 0 0.4rem" }}>
        · · ✦ · ·
      </div>

      {/* language */}
      <div className="px-4 mb-4">
        <div className="t-side-heading">{t("sidebar.language")}</div>
        <select
          className="t-select w-full px-2 py-1.5 mt-1 cursor-pointer"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label={t("sidebar.languageLabel")}
        >
          {(languages.some((l) => l.code === language)
            ? languages
            : [...languages, { code: language, name: language, nativeName: language }]
          ).map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
      </div>

      {/* question */}
      <div className="px-4">
        {question ? (
          <div>
            <div className="t-side-heading">{t("sidebar.yourQuestion")}</div>
            <div className="t-side-quote mt-1 text-[0.92rem]">&ldquo;{question}&rdquo;</div>
          </div>
        ) : (
          <button
            type="button"
            className="t-nav-item italic text-[color:var(--burgundy)]"
            onClick={() => setView("home")}
          >
            <span className="nav-icon">✎</span> {t("sidebar.setQuestion")}
          </button>
        )}
      </div>

      {/* deck info */}
      <div className="px-4 mt-4">
        <div className="t-side-heading">{t("sidebar.cardDeck")}</div>
        <div className="t-side-caption mt-1">
          {t("sidebar.deckStats1")}
          <br />
          {t("sidebar.deckStats2")}
        </div>

        {decks.length > 0 ? (
          <div className="mt-2">
            <select
              className="t-select w-full px-2 py-1.5 cursor-pointer"
              value={selectedDeck ?? ""}
              onChange={(e) => setSelectedDeck(e.target.value)}
              aria-label={t("sidebar.artworkDeck")}
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
                    {t("sidebar.allIllustrated")}
                    {selectedInfo.hasBack ? t("sidebar.backIncluded") : ""}
                  </>
                ) : (
                  t("sidebar.partialIllustrated", { count: selectedInfo.coverage })
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="t-side-caption mt-2">{t("sidebar.noDecks")}</p>
        )}

        <p className="t-side-caption mt-3">{t("sidebar.spreadMemory")}</p>
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
        {t("sidebar.debugLayout")}
      </label>
    </div>
  );
}
