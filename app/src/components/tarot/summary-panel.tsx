"use client";
/**
 * Full reading summary — port of `components/summary.py`
 * (`ReadingActivity` role): a position-by-position summary plus a
 * synthesis of Major Arcana weight and reversals once the spread is
 * complete. Rendered inside an expandable panel, expanded by default.
 */
import { useState } from "react";
import { Spread } from "@/lib/tarot/spreads";
import { Reading } from "@/lib/tarot/types";
import { buildSummary } from "@/lib/tarot/summary";
import { useTarotStore } from "@/lib/tarot/store";

export function SummaryPanel({ reading, spread }: { reading: Reading; spread: Spread }) {
  const question = useTarotStore((s) => s.question);
  const [open, setOpen] = useState(true);
  const summary = buildSummary(reading, spread, question, new Date());

  return (
    <div>
      <div className="t-ornament">· · ✦ · ·</div>
      <div className="t-panel" style={{ padding: 0 }}>
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer"
          style={{ fontFamily: "'Cinzel', Georgia, serif", fontWeight: 700, color: "var(--burgundy-deep)" }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span>Full Reading Interpretation</span>
          <span className="text-[color:var(--bronze)]">{open ? "▾" : "▸"}</span>
        </button>
        {open ? (
          <div className="t-summary px-5 pb-5 border-t border-[#e6d7b2]">
            <h3 className="text-lg mt-3">The {spread.title} Reading</h3>
            {summary.question ? (
              <p className="italic">
                You asked: <b>{summary.question}</b>
              </p>
            ) : null}
            <p className="italic text-[color:var(--ink-soft)] text-[0.92rem]">{summary.castLine}</p>

            <h4 className="mt-4">The cards, position by position</h4>
            {summary.positions.map((p) => (
              <p key={p.heading}>
                <b>{p.heading}</b> <span className="italic text-[color:var(--ink-soft)]">{p.meta}</span>
                <br />
                {p.body}
              </p>
            ))}

            <h4 className="mt-4">The shape of the reading</h4>
            {summary.tone.map((t, i) => (
              <p key={i}>{t}</p>
            ))}

            <p className="mt-4">
              <b>{`In closing, ${spread.positions[spread.positions.length - 1].name}`}</b>
              {summary.closing.slice(`In closing, ${spread.positions[spread.positions.length - 1].name}`.length)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
