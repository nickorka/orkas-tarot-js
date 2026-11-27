"use client";
/**
 * Home page — port of the launcher `TaroQuestionsActivity` in
 * `views/home.py`: asks the visitor for their question, offers sample
 * focuses, and links into the five spreads (the role the old main menu
 * played).
 */
import { useState } from "react";
import { useTarotStore, ViewKey } from "@/lib/tarot/store";
import { CardReadingType } from "@/lib/tarot/types";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n/use-i18n";
import { Md } from "./md";

const SAMPLES = ["home.sample1", "home.sample2", "home.sample3"];

const SPREAD_LINKS: Array<{ view: ViewKey; type: CardReadingType }> = [
  { view: "one-card", type: CardReadingType.ONE_CARD },
  { view: "three-card", type: CardReadingType.THREE_CARD },
  { view: "horseshoe", type: CardReadingType.HORSESHOE },
  { view: "celtic-cross", type: CardReadingType.CELTIC_CROSS },
  { view: "mirror", type: CardReadingType.MIRROR },
];

export function HomeView() {
  const t = useT();
  const question = useTarotStore((s) => s.question);
  const setQuestion = useTarotStore((s) => s.setQuestion);
  const setView = useTarotStore((s) => s.setView);
  const [draft, setDraft] = useState(question);
  const { toast } = useToast();

  return (
    <div className="flex-1 flex flex-col">
      <div className="t-hero">
        <h1>{t("app.name")}</h1>
        <div className="t-tagline">{t("home.tagline")}</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="t-panel">
        <p>
          <Md text={t("home.intro1")} />
        </p>
        <p className="mt-3">
          <Md text={t("home.intro2")} />
        </p>
      </div>

      <h3 className="mt-6 mb-2">{t("home.yourQuestion")}</h3>
      <textarea
        className="t-textarea w-full p-2.5 min-h-[80px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t("home.placeholder")}
        aria-label={t("home.questionAria")}
      />
      <div className="flex items-center gap-4 mt-3">
        <button
          type="button"
          className="t-btn t-btn-primary"
          onClick={() => {
            setQuestion(draft.trim());
            toast({ title: t("question.saved"), description: draft.trim() || t("question.cleared") });
          }}
        >
          {t("question.save")}
        </button>
        {question ? (
          <span className="italic">
            {t("home.savedQuestion")} <b>{question}</b>
          </span>
        ) : null}
      </div>

      <h3 className="mt-6 mb-2">{t("home.needStart")}</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        {SAMPLES.map((id) => {
          const sample = t(id);
          return (
            <button
              key={id}
              type="button"
              className="t-btn text-left"
              onClick={() => {
                setQuestion(sample);
                setDraft(sample);
              }}
            >
              {sample}
            </button>
          );
        })}
      </div>

      <h3 className="mt-6 mb-2">{t("home.chooseSpread")}</h3>
      <div className="t-panel">
        <table className="t-table">
          <tbody>
            {SPREAD_LINKS.map((s) => (
              <tr key={s.view}>
                <td className="t-name" style={{ width: 140 }}>
                  <b>{t(`spread.${s.type}.title`)}</b>
                </td>
                <td>{t(`home.blurb.${s.type}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {SPREAD_LINKS.map((s) => (
          <button key={s.view} type="button" className="t-btn" onClick={() => setView(s.view)}>
            {t(`spread.${s.type}.title`)}
          </button>
        ))}
      </div>

      <div className="t-footer">{t("home.footer")}</div>
    </div>
  );
}
