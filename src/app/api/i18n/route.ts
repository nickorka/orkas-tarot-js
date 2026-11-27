import { NextResponse } from "next/server";
import { runSql } from "@/lib/snowflake/sql";
import { isLanguageCode, LanguageBundle } from "@/lib/i18n/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; bundle: LanguageBundle }>();

/**
 * GET ?lang=xx -> { ui, cards } for that language from TAROT.APP.UI_TEXT
 * and TAROT.APP.CARDS. Missing entries are filled client-side from the
 * bundled English texts, so English itself needs no request.
 */
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang");
  if (!isLanguageCode(lang)) return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  const hit = cache.get(lang);
  if (hit && Date.now() - hit.at < TTL_MS) return NextResponse.json(hit.bundle);

  try {
    const [uiRows, cardRows] = await Promise.all([
      runSql("SELECT UI_ID, CONTENT FROM TAROT.APP.UI_TEXT WHERE LANGUAGE_CODE = ?", [lang]),
      runSql(
        `SELECT CARD_ID, NAME, ARCANA, RANK, KEYWORDS, MEANING, UPRIGHT, REVERSED
         FROM TAROT.APP.CARDS WHERE LANGUAGE_CODE = ? ORDER BY CARD_ID`,
        [lang]
      ),
    ]);
    const bundle: LanguageBundle = {
      ui: Object.fromEntries(uiRows.filter(([id, text]) => id && text).map(([id, text]) => [id!, text!])),
      cards: cardRows.map(([cardId, name, arcana, rank, keywords, meaning, upright, reversed]) => ({
        cardId: Number(cardId),
        name: name ?? "",
        arcana: arcana ?? "",
        rank: rank ?? "",
        keywords: keywords ?? "",
        meaning: meaning ?? "",
        upright: upright ?? "",
        reversed: reversed ?? "",
      })),
    };
    cache.set(lang, { at: Date.now(), bundle });
    return NextResponse.json(bundle);
  } catch (err) {
    console.error(`Loading language ${lang} failed:`, err);
    return NextResponse.json({ error: "Translations are unavailable right now." }, { status: 502 });
  }
}
