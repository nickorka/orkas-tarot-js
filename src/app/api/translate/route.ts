import { NextResponse } from "next/server";
import { z } from "zod";
import { runSql } from "@/lib/snowflake/sql";
import { isLanguageCode } from "@/lib/i18n/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  texts: z.array(z.string().max(20000)).min(1).max(100),
  lang: z.string().refine(isLanguageCode),
});

/**
 * POST { texts, lang } -> { texts } — translates English dynamic content
 * (reading summary, agent interpretation) with AI_TRANSLATE, preserving
 * order. English needs no translation and returns the input unchanged.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { texts, lang } = parsed.data;
  if (lang === "en") return NextResponse.json({ texts });

  // Blank strings are passed through; only the rest is sent to Snowflake.
  const todo = texts.map((t, i) => ({ t, i })).filter(({ t }) => t.trim() !== "");
  const out = [...texts];
  if (todo.length === 0) return NextResponse.json({ texts: out });

  try {
    const rows = await runSql(
      `SELECT f.index, AI_TRANSLATE(f.value::STRING, 'en', ?)
       FROM TABLE(FLATTEN(INPUT => PARSE_JSON(?))) f ORDER BY f.index`,
      [lang, JSON.stringify(todo.map(({ t }) => t))],
      req.signal
    );
    for (const [index, translated] of rows) {
      const item = todo[Number(index)];
      if (item && translated) out[item.i] = translated;
    }
    return NextResponse.json({ texts: out });
  } catch (err) {
    console.error("Translation failed:", err);
    return NextResponse.json({ error: "Translation is unavailable right now." }, { status: 502 });
  }
}
