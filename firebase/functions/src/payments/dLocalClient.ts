import * as crypto from "crypto";

/**
 * dLocal API Client
 *
 * HMAC-SHA256 authenticated HTTP client for dLocal payments API.
 * Reads credentials from Firebase Secret Manager env vars.
 *
 * Signature format: HMAC-SHA256(xLogin + xDate + body, secretKey)
 * Auth header:  V2-HMAC-SHA256, login:{xLogin}, date:{xDate}, authorization:{signature}
 */

function getConfig() {
  const xLogin = process.env.DLOCAL_X_LOGIN;
  const xTransKey = process.env.DLOCAL_X_TRANS_KEY;
  const secretKey = process.env.DLOCAL_SECRET_KEY;
  const baseUrl = process.env.DLOCAL_BASE_URL || "https://sandbox.dlocal.com";

  if (!xLogin || !xTransKey || !secretKey) {
    throw new Error("dLocal credentials not configured");
  }

  return { xLogin, xTransKey, secretKey, baseUrl };
}

function buildSignature(
  xLogin: string,
  xDate: string,
  body: string,
  secretKey: string,
): string {
  const message = xLogin + xDate + body;
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
}

function buildHeaders(body: string) {
  const { xLogin, xTransKey, secretKey } = getConfig();
  const xDate = new Date().toISOString();
  const signature = buildSignature(xLogin, xDate, body, secretKey);

  return {
    "Content-Type": "application/json",
    "X-Date": xDate,
    "X-Login": xLogin,
    "X-Trans-Key": xTransKey,
    "X-Version": "2.1",
    "Authorization":
      `V2-HMAC-SHA256, login:${xLogin}, date:${xDate}, authorization:${signature}`,
  };
}

export async function dLocalPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { baseUrl } = getConfig();
  const bodyStr = JSON.stringify(body);
  const headers = buildHeaders(bodyStr);

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: bodyStr,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("dLocal API error:", { path, status: response.status, data });
    throw new Error(
      `dLocal API error: ${response.status} — ${data?.message || JSON.stringify(data)}`,
    );
  }

  return data as T;
}

export async function dLocalGet<T = unknown>(path: string): Promise<T> {
  const { baseUrl } = getConfig();
  const headers = buildHeaders("");

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("dLocal API error:", { path, status: response.status, data });
    throw new Error(
      `dLocal API error: ${response.status} — ${data?.message || JSON.stringify(data)}`,
    );
  }

  return data as T;
}

/**
 * Verify dLocal webhook signature.
 *
 * dLocal sends: Authorization: V2-HMAC-SHA256, login:{xLogin}, date:{xDate}, authorization:{signature}
 * We verify:    HMAC-SHA256(xLogin + xDate + body, secretKey) === signature
 */
export function verifyDLocalWebhookSignature(
  body: string,
  authHeader: string | undefined,
): boolean {
  if (!authHeader) return false;

  try {
    const { xLogin, secretKey } = getConfig();

    // Parse "V2-HMAC-SHA256, login:X, date:Y, authorization:Z"
    const parts: Record<string, string> = {};
    const segments = authHeader.split(",").map((s) => s.trim());
    for (const seg of segments) {
      const colonIdx = seg.indexOf(":");
      if (colonIdx > -1) {
        const key = seg.substring(0, colonIdx).trim();
        const value = seg.substring(colonIdx + 1).trim();
        parts[key] = value;
      }
    }

    const dateFromHeader = parts["date"];
    const signatureFromHeader = parts["authorization"];

    if (!dateFromHeader || !signatureFromHeader) return false;

    const expected = buildSignature(xLogin, dateFromHeader, body, secretKey);

    return crypto.timingSafeEqual(
      Buffer.from(signatureFromHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}
