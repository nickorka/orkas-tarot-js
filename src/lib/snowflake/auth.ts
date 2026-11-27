/**
 * Server-only key-pair (JWT) authentication shared by the Snowflake REST
 * clients (MCP server and SQL API).
 *
 * Configuration (environment):
 *   SNOWFLAKE_ACCOUNT  account identifier, e.g. EVOHOMA-LAB15936
 *   SNOWFLAKE_USER     user with the registered public key (DBA)
 *   PRIVATE_KEY        PKCS#8 PEM private key; literal "\n" sequences are accepted
 *   PRIVATE_KEY_PASSPHRASE  optional, for an encrypted key
 *
 * Import from server code only — the private key must never reach the browser.
 */
import { createHash, createPrivateKey, createPublicKey, sign, KeyObject } from "crypto";

export function requireEnv(name: string): string {
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

/** https://<account>.snowflakecomputing.com — hostnames use hyphens instead of underscores. */
export function accountBaseUrl(): string {
  const account = requireEnv("SNOWFLAKE_ACCOUNT");
  return `https://${account.toLowerCase().replace(/_/g, "-")}.snowflakecomputing.com`;
}

/** Authorization headers for a Snowflake REST call as SNOWFLAKE_USER. */
export function authHeaders(): Record<string, string> {
  const jwt = buildJwt(requireEnv("SNOWFLAKE_ACCOUNT"), requireEnv("SNOWFLAKE_USER"), loadPrivateKey());
  return {
    Authorization: `Bearer ${jwt}`,
    "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
  };
}
