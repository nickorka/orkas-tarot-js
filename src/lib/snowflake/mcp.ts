/**
 * Server-only client for the Snowflake-managed MCP server
 * TAROT.APP.TAROT_MCP, authenticated with key-pair (JWT) auth (see auth.ts).
 *
 * The MCP session runs under the user's DEFAULT_ROLE, which needs USAGE on
 * the MCP server and the TAROT_AGENT, plus a DEFAULT_WAREHOUSE.
 * Import from server code only — the private key must never reach the browser.
 */
import { accountBaseUrl, authHeaders } from "./auth";

const MCP_DATABASE = "TAROT";
const MCP_SCHEMA = "APP";
const MCP_SERVER = "TAROT_MCP";
const AGENT_TOOL = "tarot_agent";

function mcpUrl(): string {
  return `${accountBaseUrl()}/api/v2/databases/${MCP_DATABASE}/schemas/${MCP_SCHEMA}/mcp-servers/${MCP_SERVER}`;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: { content?: { type: string; text?: string }[]; isError?: boolean };
  error?: { code: number; message: string };
}

/** tools/call answers as an SSE stream; the last `data:` event is the full JSON-RPC response. */
function parseResponse(body: string, contentType: string): JsonRpcResponse {
  if (!contentType.includes("text/event-stream")) return JSON.parse(body);
  let last: JsonRpcResponse | null = null;
  for (const event of body.split(/\r?\n\r?\n/)) {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    const msg = JSON.parse(data);
    if (msg.result !== undefined || msg.error !== undefined) last = msg;
  }
  if (!last) throw new Error("MCP server returned no response");
  return last;
}

/** Sends a prompt to the tarot agent tool and returns its text answer. */
export async function askTarotAgent(text: string, signal?: AbortSignal): Promise<string> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  const res = await fetch(mcpUrl(), {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: AGENT_TOOL, arguments: { text } },
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`MCP server error ${res.status}: ${body.slice(0, 500)}`);

  const rpc = parseResponse(body, res.headers.get("content-type") ?? "");
  if (rpc.error) throw new Error(`MCP error ${rpc.error.code}: ${rpc.error.message}`);
  const answer = (rpc.result?.content ?? [])
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("\n\n");
  if (rpc.result?.isError) throw new Error(answer || "Tarot agent failed");
  return unwrapAgentText(answer);
}

/** The agent tool wraps its reply as a JSON string `{"content":[{"text":...}]}`; extract the text. */
function unwrapAgentText(answer: string): string {
  try {
    const inner = JSON.parse(answer);
    if (Array.isArray(inner?.content)) {
      const text = inner.content
        .filter((c: { text?: unknown }) => typeof c?.text === "string")
        .map((c: { text: string }) => c.text)
        .join("\n\n");
      if (text) return text;
    }
  } catch {
    // plain text answer
  }
  return answer;
}
