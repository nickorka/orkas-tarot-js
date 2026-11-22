/**
 * Server-only client for the Snowflake-managed MCP server
 * TAROT.APP.TAROT_MCP, authenticated with key-pair (JWT) auth.
 *
 * Configuration (environment):
 *   SNOWFLAKE_ACCOUNT  account identifier, e.g. EVOHOMA-LAB15936
 *   SNOWFLAKE_USER     user with the registered public key (DBA)
 *   PRIVATE_KEY        PKCS#8 PEM private key; literal "\n" sequences are accepted
 *   PRIVATE_KEY_PASSPHRASE  optional, for an encrypted key
 *
 * The MCP session runs under the user's DEFAULT_ROLE, which needs USAGE on
 * the MCP server and the TAROT_AGENT, plus a DEFAULT_WAREHOUSE.
 * Import from server code only — the private key must never reach the browser.
 */
import { createHash, createPrivateKey, createPublicKey, sign, KeyObject } from "crypto";

const MCP_DATABASE = "TAROT";
const MCP_SCHEMA = "APP";
const MCP_SERVER = "TAROT_MCP";
const AGENT_TOOL = "tarot_agent";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function loadPrivateKey(): KeyObject {
  const pem = requireEnv("PRIVATE_KEY").replace(/\\n/g, "\n").trim();
  return createPrivateKey({ key: pem, format: "pem", passphrase: process.env.PRIVATE_KEY_PASSPHRASE });
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Builds the key-pair JWT Snowflake expects (iss = ACCOUNT.USER.SHA256:<fingerprint>). */
function buildJwt(account: string, user: string, key: KeyObject): string {
  const publicDer = createPublicKey(key).export({ type: "spki", format: "der" });
  const fingerprint = "SHA256:" + createHash("sha256").update(publicDer).digest("base64");
  // Account locator in the JWT: upper case, no region/cloud suffix after the first dot.
  const acct = account.split(".")[0].toUpperCase();
  const qualifiedUser = `${acct}.${user.toUpperCase()}`;
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iss: `${qualifiedUser}.${fingerprint}`, sub: qualifiedUser, iat: now, exp: now + 3600 })
  );
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), key);
  return `${header}.${payload}.${base64url(signature)}`;
}

function mcpUrl(account: string): string {
  // Hostnames must use hyphens instead of underscores.
  const host = `${account.toLowerCase().replace(/_/g, "-")}.snowflakecomputing.com`;
  return `https://${host}/api/v2/databases/${MCP_DATABASE}/schemas/${MCP_SCHEMA}/mcp-servers/${MCP_SERVER}`;
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
  const account = requireEnv("SNOWFLAKE_ACCOUNT");
  const user = requireEnv("SNOWFLAKE_USER");
  const jwt = buildJwt(account, user, loadPrivateKey());

  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  const res = await fetch(mcpUrl(account), {
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
