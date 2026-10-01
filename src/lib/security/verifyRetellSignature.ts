import crypto from "crypto";

/**
 * Verify Retell webhook HMAC-SHA256 signature (timing-safe).
 * Retell sends the hex digest in `x-retell-signature`.
 */
export function verifyRetellSignature(
  rawBody: string,
  signatureHeader: string | null,
  apiKey: string,
): boolean {
  if (!signatureHeader || !apiKey) return false;

  const expectedSignature = crypto
    .createHmac("sha256", apiKey)
    .update(rawBody, "utf8")
    .digest("hex");

  const provided = signatureHeader.trim().replace(/^sha256=/i, "");

  const trustedBuffer = Buffer.from(expectedSignature, "utf8");
  const untrustedBuffer = Buffer.from(provided, "utf8");

  if (trustedBuffer.length !== untrustedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(trustedBuffer, untrustedBuffer);
}

export function signRetellPayload(rawBody: string, apiKey: string): string {
  return crypto.createHmac("sha256", apiKey).update(rawBody, "utf8").digest("hex");
}

/**
 * Decide whether signature verification is required for this request.
 * - Production: always required
 * - Dev/demo: required when a signature header is present OR RETELL_WEBHOOK_ENFORCE=true
 */
export function shouldEnforceRetellSignature(
  signatureHeader: string | null,
): boolean {
  if (process.env.RETELL_WEBHOOK_ENFORCE === "true") return true;
  if (process.env.NODE_ENV === "production") return true;
  return Boolean(signatureHeader);
}

export function getRetellSigningKey(): string {
  return (
    process.env.RETELL_WEBHOOK_SECRET?.trim() ||
    process.env.RETELL_API_KEY?.trim() ||
    ""
  );
}
