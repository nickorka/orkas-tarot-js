import { NextResponse } from "next/server";
import { z } from "zod";
import { askTarotAgent } from "@/lib/snowflake/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The prompt is built client-side (lib/tarot/interpretation-prompt.ts) so the popup can display it.
const schema = z.object({ prompt: z.string().min(1).max(20000) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const interpretation = await askTarotAgent(parsed.data.prompt, req.signal);
    return NextResponse.json({ interpretation });
  } catch (err) {
    console.error("Interpretation failed:", err);
    return NextResponse.json({ error: "The cards are silent right now. Please try again later." }, { status: 502 });
  }
}
