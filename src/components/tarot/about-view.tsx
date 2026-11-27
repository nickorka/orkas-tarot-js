"use client";
/**
 * About & Help — port of `views/about.py`.
 */
import { useTarotStore, ViewKey } from "@/lib/tarot/store";
import { useT } from "@/lib/i18n/use-i18n";
import { Md } from "./md";

const HOW_TO: Array<{ n: number; view?: ViewKey }> = [{ n: 1, view: "home" }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];

export function AboutView() {
  const t = useT();
  const setView = useTarotStore((s) => s.setView);

  return (
    <div className="flex-1 flex flex-col">
      <div className="t-hero">
        <h1>{t("about.title")}</h1>
        <div className="t-tagline">{t("about.tagline")}</div>
      </div>
      <div className="t-ornament">✦ ─── ❖ ─── ✦</div>

      <div className="t-panel">
        <p>
          <Md text={t("about.p1")} />
        </p>
        <p className="mt-3">
          <Md text={t("about.p2")} />
        </p>
      </div>

      <h3 className="mt-6 mb-2">{t("about.howTo")}</h3>
      <div className="t-panel">
        <ol className="list-decimal ml-5 space-y-1.5">
          {HOW_TO.map((h) => (
            <li key={h.n}>
              {h.view ? (
                <button
                  type="button"
                  className="text-[color:var(--burgundy)] font-semibold underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
                  onClick={() => setView(h.view!)}
                >
                  <b>{t(`about.step${h.n}`)}</b>
                </button>
              ) : (
                <b>{t(`about.step${h.n}`)}</b>
              )}{" "}
              {t(`about.step${h.n}Text`)}
            </li>
          ))}
        </ol>
      </div>

      <div className="t-footer">{t("about.footer")}</div>
    </div>
  );
}
