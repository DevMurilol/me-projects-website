const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResult {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  metadata?: { result_with_testing_key?: boolean };
}

/**
 * Server-side Turnstile check. Fails closed: a network error, a non-2xx reply, a wrong action
 * or a hostname outside `hostnames` all count as "not verified".
 */
export async function verifyTurnstile(input: {
  token: unknown;
  secret: string;
  remoteIp: string | null;
  action: string;
  hostnames: Set<string>;
}): Promise<boolean> {
  const { token, secret, remoteIp, action, hostnames } = input;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || hostnames.size === 0) return false;

  let result: SiteverifyResult;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const response = await fetch(SITEVERIFY, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    result = await response.json();
  } catch (error) {
    console.error("[enquiry] Turnstile siteverify failed:", error);
    return false;
  }

  if (!result.success) {
    console.warn("[enquiry] Turnstile rejected the token:", result["error-codes"]);
    return false;
  }
  // Cloudflare's testing keys (local dev only) return no action, so the action check is skipped
  // for them. The hostname check still applies: testing keys report "example.com", which is only
  // allowed in .dev.vars, never in the production TURNSTILE_HOSTNAMES.
  const actionOk = result.action === action || (result.metadata?.result_with_testing_key === true && !result.action);
  if (!actionOk || !result.hostname || !hostnames.has(result.hostname)) {
    console.warn("[enquiry] Turnstile token for the wrong action or hostname:", result.action, result.hostname);
    return false;
  }
  return true;
}
