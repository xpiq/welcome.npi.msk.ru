import {
  checkCaptchaRequestLimit,
  createCaptcha,
  getClientIp,
} from "@lib/contactSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request) {
  const limit = checkCaptchaRequestLimit(getClientIp(request));

  if (!limit.allowed) {
    return Response.json(
      { ok: false, message: "Слишком много запросов. Повторите позднее." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  return Response.json({ ok: true, ...createCaptcha() });
}
