/**
 * Server-only Snowflake SQL API client (POST /api/v2/statements) using the
 * same key-pair JWT as the MCP client. Runs under SNOWFLAKE_USER's
 * DEFAULT_ROLE on warehouse SNOWFLAKE_WAREHOUSE (default TAROT_WH) in TAROT.APP.
 *
 * Values are always passed as bind variables (`?`), never concatenated.
 */
import { accountBaseUrl, authHeaders } from "./auth";

type Row = (string | null)[];

interface StatementResponse {
  code?: string;
  message?: string;
  statementHandle?: string;
  statementStatusUrl?: string;
  resultSetMetaData?: { partitionInfo?: unknown[] };
  data?: Row[];
}

const POLL_MS = 500;
const MAX_POLLS = 240;

async function call(url: string, init: RequestInit): Promise<{ status: number; body: StatementResponse }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let body: StatementResponse = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`SQL API error ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`SQL API error ${res.status} ${body.code ?? ""}: ${body.message ?? text.slice(0, 300)}`);
  }
  return { status: res.status, body };
}

/** Runs one statement and returns all rows (every column as string or null). */
export async function runSql(statement: string, binds: string[] = [], signal?: AbortSignal): Promise<Row[]> {
  const base = accountBaseUrl();
  const bindings = Object.fromEntries(binds.map((v, i) => [String(i + 1), { type: "TEXT", value: v }]));

  let { status, body } = await call(`${base}/api/v2/statements`, {
    method: "POST",
    signal,
    body: JSON.stringify({
      statement,
      timeout: 120,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || "TAROT_WH",
      database: "TAROT",
      schema: "APP",
      bindings,
    }),
  });

  // 202 = still running; poll the status URL until the result is ready.
  for (let i = 0; status === 202; i++) {
    if (i >= MAX_POLLS) throw new Error("SQL API statement timed out");
    await new Promise((r) => setTimeout(r, POLL_MS));
    ({ status, body } = await call(`${base}${body.statementStatusUrl}`, { method: "GET", signal }));
  }

  const rows = [...(body.data ?? [])];
  const partitions = body.resultSetMetaData?.partitionInfo?.length ?? 1;
  for (let p = 1; p < partitions; p++) {
    const part = await call(`${base}/api/v2/statements/${body.statementHandle}?partition=${p}`, { method: "GET", signal });
    rows.push(...(part.body.data ?? []));
  }
  return rows;
}
