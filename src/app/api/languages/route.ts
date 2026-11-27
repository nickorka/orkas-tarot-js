import { NextResponse } from "next/server";
import { runSql } from "@/lib/snowflake/sql";
import { ENGLISH, LanguageInfo } from "@/lib/i18n/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET -> { languages: LanguageInfo[] } from TAROT.APP.LANGUAGES (English first). */
export async function GET() {
  try {
    const rows = await runSql(
      `SELECT LANGUAGE_CODE, NAME, NATIVE_NAME FROM TAROT.APP.LANGUAGES
       WHERE ENABLED ORDER BY IFF(LANGUAGE_CODE = 'en', 0, 1), NAME`
    );
    const languages: LanguageInfo[] = rows.map(([code, name, nativeName]) => ({
      code: code ?? "",
      name: name ?? "",
      nativeName: nativeName ?? name ?? "",
    }));
    if (!languages.some((l) => l.code === "en")) languages.unshift(ENGLISH);
    return NextResponse.json({ languages });
  } catch (err) {
    // The app stays usable in English when the database is unreachable.
    console.error("Loading languages failed:", err);
    return NextResponse.json({ languages: [ENGLISH] });
  }
}
