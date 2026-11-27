"use client";
/**
 * "Interpretation" button + popup: asks the Snowflake tarot agent
 * (via /api/interpretation -> TAROT.APP.TAROT_MCP) to interpret the
 * current question and the face-up cards of the spread.
 */
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Spread } from "@/lib/tarot/spreads";
import { Reading } from "@/lib/tarot/types";
import { buildInterpretationPrompt } from "@/lib/tarot/interpretation-prompt";
import { useTarotStore } from "@/lib/tarot/store";
import { translateTexts, useLocalSpread, useT } from "@/lib/i18n/use-i18n";
import { SOURCE_LANGUAGE } from "@/lib/i18n/en";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type State =
  | { status: "idle" }
  | { status: "loading"; message: string }
  | { status: "done"; text: string; note?: string }
  | { status: "error"; message: string };

export function InterpretationButton({
  question,
  spread,
  reading,
}: {
  question: string;
  spread: Spread;
  reading: Reading | null;
}) {
  const t = useT();
  const local = useLocalSpread(spread);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  // A reading exists only once every card of the spread is dealt and face up.
  const hasReading =
    !!reading &&
    reading.spreadCards.length >= spread.cardCount &&
    reading.spreadCards.every((sc) => sc.flipped);

  // The agent always answers in English; other languages are translated
  // afterwards and cached alongside the English text.
  const run = async () => {
    if (!hasReading || !reading) return;
    const store = useTarotStore.getState();
    const lang = store.language;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let english = store.interpretations[spread.readingType]?.en;
      if (!english) {
        setState({ status: "loading", message: t("interp.loading") });
        const res = await fetch("/api/interpretation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildInterpretationPrompt(question, spread, reading) }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (!data.interpretation) {
          setState({ status: "done", text: t("interp.empty") });
          return;
        }
        english = data.interpretation as string;
        useTarotStore.getState().setInterpretation(spread.readingType, english);
      }

      if (lang === SOURCE_LANGUAGE) {
        setState({ status: "done", text: english });
        return;
      }
      const cached = useTarotStore.getState().interpretations[spread.readingType]?.tr[lang];
      if (cached) {
        setState({ status: "done", text: cached });
        return;
      }
      setState({ status: "loading", message: t("app.translating") });
      try {
        const [translated] = await translateTexts([english], lang, controller.signal);
        useTarotStore.getState().setInterpretationTranslation(spread.readingType, lang, translated);
        setState({ status: "done", text: translated });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({ status: "done", text: english, note: t("app.translationFailed") });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      abortRef.current?.abort();
      setState({ status: "idle" });
    }
  };

  return (
    <>
      <button
        type="button"
        className="t-btn disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!hasReading}
        title={hasReading ? undefined : t("interp.disabled")}
        onClick={() => {
          setOpen(true);
          void run();
        }}
      >
        {t("interp.button")}
      </button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-[#f8f1de] border-[#d8c69a]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Cinzel', Georgia, serif", color: "var(--burgundy-deep)" }}>
              {t("interp.title", { spread: local.title })}
            </DialogTitle>
            {question ? <DialogDescription className="italic">&ldquo;{question}&rdquo;</DialogDescription> : null}
          </DialogHeader>

          {state.status === "loading" ? (
            <div className="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
              <div className="h-12 w-12 rounded-full border-4 border-[#d8c69a] border-t-[color:var(--burgundy-deep)] animate-spin" />
              <p className="italic text-[color:var(--ink-soft)]">{state.message}</p>
              <div className="w-full max-w-sm h-1.5 overflow-hidden rounded-full bg-[#e6d7b2]">
                <div className="h-full w-1/3 rounded-full bg-[color:var(--bronze)] animate-[t-indeterminate_1.4s_ease-in-out_infinite]" />
              </div>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-[color:var(--burgundy-deep)]">{state.message}</p>
              <button type="button" className="t-btn" onClick={() => void run()}>
                {t("interp.retry")}
              </button>
            </div>
          ) : null}

          {state.status === "done" ? (
            <div className="t-summary">
              {state.note ? <p className="italic text-[color:var(--ink-faint)] text-[0.85rem]">{state.note}</p> : null}
              <ReactMarkdown>{state.text}</ReactMarkdown>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
