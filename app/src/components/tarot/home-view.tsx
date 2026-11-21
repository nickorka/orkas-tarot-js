"use client";
/**
 * Home page — port of the launcher `TaroQuestionsActivity` in
 * `views/home.py`: asks the visitor for their question, offers sample
 * focuses, and links into the five spreads (the role the old main menu
 * played).
 */
import { useState } from "react";
import { useTarotStore, ViewKey } from "@/lib/tarot/store";
import { useToast } from "@/hooks/use-toast";

const SAMPLES = [
  "What should I focus on this month?",
  "What does my heart need right now?",
  "How is my career truly unfolding?",
];

const SPREAD_LINKS: Array<{ view: ViewKey; label: string; blurb: string }> = [
  { view: "one-card", label: "One Card", blurb: "A single focused answer — daily guidance, quick clarity." },
  { view: "three-card", label: "Three Card", blurb: "Past, present, future — the classic narrative arc." },
  { view: "horseshoe", label: "Horseshoe", blurb: "Seven cards in a lucky arc — a rounded situation reading." },
  { view: "celtic-cross", label: "Celtic Cross", blurb: "The famous ten-card spread for weighty questions." },
  { view: "mirror", label: "Mirror", blurb: "Eleven cards across the glass — self-knowledge and reflection." },
];

export function HomeView() {
  const question = useTarotStore((s) => s.question);
  const setQuestion = useTarotStore((s) => s.setQuestion);
  const setView = useTarotStore((s) => s.setView);
  const [draft, setDraft] = useState(question);
  const { toast } = useToast();

  return (
    <div className="flex-1 flex flex-col">
      <div className="t-hero">
        <h1>Orka&apos;s Tarot Pro</h1>
        <div className="t-tagline">Ask the cards — they answer those who ask clearly</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="t-panel">
        <p>
          Welcome, seeker. This is the web edition of <b>Orka&apos;s Tarot Pro</b>, ported from
          the original Android application — now running as a <b>Node.js</b> app (Next.js +
          React). The ritual is unchanged: hold one question in your mind, choose a spread,
          shuffle the seventy-eight cards, and turn each card by hand. Every card can be read
          upright or reversed, alone or woven into the full interpretation that appears once
          the spread is complete.
        </p>
        <p className="mt-3">
          A clear question is the single most important card on the table. Vague questions
          invite vague answers; name what you truly want to know, and choose the spread
          that fits its weight.
        </p>
      </div>

      <h3 className="mt-6 mb-2">Your question</h3>
      <textarea
        className="t-textarea w-full p-2.5 min-h-[80px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. What should I know about the path I am currently on?"
        aria-label="Focus your mind on a single question."
      />
      <div className="flex items-center gap-4 mt-3">
        <button
          type="button"
          className="t-btn t-btn-primary"
          onClick={() => {
            setQuestion(draft.trim());
            toast({ title: "Question saved", description: draft.trim() || "(cleared)" });
          }}
        >
          Save question
        </button>
        {question ? (
          <span className="italic">
            Saved question: <b>{question}</b>
          </span>
        ) : null}
      </div>

      <h3 className="mt-6 mb-2">Need a starting point?</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        {SAMPLES.map((sample) => (
          <button
            key={sample}
            type="button"
            className="t-btn text-left"
            onClick={() => {
              setQuestion(sample);
              setDraft(sample);
            }}
          >
            {sample}
          </button>
        ))}
      </div>

      <h3 className="mt-6 mb-2">Choose your spread</h3>
      <div className="t-panel">
        <table className="t-table">
          <tbody>
            {SPREAD_LINKS.map((s) => (
              <tr key={s.view}>
                <td className="t-name" style={{ width: 140 }}>
                  <b>{s.label}</b>
                </td>
                <td>{s.blurb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {SPREAD_LINKS.map((s) => (
          <button key={s.view} type="button" className="t-btn" onClick={() => setView(s.view)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="t-footer">✦ Orka&apos;s Tarot Pro — the Node.js edition of the Streamlit port of the Android original ✦</div>
    </div>
  );
}
