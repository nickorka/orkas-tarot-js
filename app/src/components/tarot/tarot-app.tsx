"use client";
/**
 * Root client shell — the port of app.py: sets up the parchment chrome,
 * mounts the sidebar (the web replacement for the Android launcher
 * menu) and routes between pages, keeping Streamlit's session-state
 * semantics across page switches.
 */
import { useEffect, useState } from "react";
import { CardReadingType } from "@/lib/tarot/types";
import { useTarotStore } from "@/lib/tarot/store";
import { DeckInfo } from "@/lib/tarot/store";
import { SidebarContent } from "./sidebar";
import { HomeView } from "./home-view";
import { SpreadView } from "./spread-view";
import { DeckBrowserView } from "./deck-browser-view";
import { AboutView } from "./about-view";

export function TarotApp({ decks }: { decks: DeckInfo[] }) {
  const view = useTarotStore((s) => s.view);
  const setDecks = useTarotStore((s) => s.setDecks);
  const debugLayout = useTarotStore((s) => s.debugLayout);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setDecks(decks);
  }, [decks, setDecks]);

  // context-menu / copy protection — port of the <script> block in styles.inject_global_css
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", stop);
    document.addEventListener("copy", stop);
    document.addEventListener("cut", stop);
    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("copy", stop);
      document.removeEventListener("cut", stop);
    };
  }, []);

  return (
    <div className={`t-app min-h-screen${debugLayout ? " t-debug" : ""}`}>
      {/* mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[rgba(248,241,222,0.92)] backdrop-blur border-b border-[#d8c69a]">
        <button
          type="button"
          className="t-btn px-3 py-1.5"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="side-brand text-[0.95rem]">
          <span className="star">✦</span> Orka&apos;s Tarot Pro
        </span>
        <span className="w-10" />
      </header>

      {/* sidebar — fixed on desktop, drawer on mobile */}
      <aside
        className={`t-sidebar fixed inset-y-0 left-0 z-40 w-[270px] overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <button
          type="button"
          className="absolute top-3 right-3 lg:hidden text-xl cursor-pointer bg-transparent border-none"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
        <SidebarContent />
      </aside>
      {menuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* main area */}
      <main className="lg:ml-[270px] flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col w-full max-w-[1240px] mx-auto px-4 sm:px-8 py-6">
          {view === "home" ? <HomeView /> : null}
          {view === "one-card" ? <SpreadView readingType={CardReadingType.ONE_CARD} /> : null}
          {view === "three-card" ? <SpreadView readingType={CardReadingType.THREE_CARD} /> : null}
          {view === "horseshoe" ? <SpreadView readingType={CardReadingType.HORSESHOE} /> : null}
          {view === "celtic-cross" ? <SpreadView readingType={CardReadingType.CELTIC_CROSS} /> : null}
          {view === "mirror" ? <SpreadView readingType={CardReadingType.MIRROR} /> : null}
          {view === "deck-browse" ? <DeckBrowserView /> : null}
          {view === "about" ? <AboutView /> : null}
        </div>
      </main>
    </div>
  );
}
