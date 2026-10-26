import { randomBytes, timingSafeEqual } from "crypto";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;
const CAPTCHA_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const CAPTCHA_REQUEST_LIMIT = 20;
const FORM_WINDOW_MS = 10 * 60 * 1000;
const FORM_LIMIT = 5;

const challenges = new Map();
const captchaRequests = new Map();
const formRequests = new Map();

const prune = (store, now) => {
  for (const [key, value] of store) {
    if (Array.isArray(value)) {
      const active = value.filter((timestamp) => timestamp > now - CAPTCHA_REQUEST_WINDOW_MS);
      if (active.length) {
        store.set(key, active);
      } else {
        store.delete(key);
      }
    } else if (value.expiresAt <= now) {
      store.delete(key);
    }
  }
};

const limitRequest = (store, key, limit, windowMs) => {
  const now = Date.now();
  prune(store, now);
  const timestamps = (store.get(key) || []).filter(
    (timestamp) => timestamp > now - windowMs
  );

  if (timestamps.length >= limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000),
    };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true };
};

export const getClientIp = (request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || request.headers.get("x-real-ip") || "unknown";
};

export const checkCaptchaRequestLimit = (ip) =>
  limitRequest(captchaRequests, ip, CAPTCHA_REQUEST_LIMIT, CAPTCHA_REQUEST_WINDOW_MS);

export const checkFormRequestLimit = (ip) =>
  limitRequest(formRequests, ip, FORM_LIMIT, FORM_WINDOW_MS);

export const createCaptcha = () => {
  const firstNumber = Math.floor(Math.random() * 8) + 2;
  const secondNumber = Math.floor(Math.random() * 8) + 2;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;

  prune(challenges, Date.now());
  challenges.set(token, {
    answer: String(firstNumber + secondNumber),
    expiresAt,
  });

  return {
    question: `${firstNumber} + ${secondNumber}`,
    token,
  };
};

export const verifyCaptcha = (token, answer) => {
  const challenge = challenges.get(token);

  // Every submitted challenge is consumed, including an incorrect answer.
  // This prevents repeated guesses against one issued token.
  challenges.delete(token);

  if (!challenge || challenge.expiresAt <= Date.now()) {
    return { valid: false, message: "Проверка устарела. Получите новую." };
  }

  const expected = Buffer.from(challenge.answer);
  const actual = Buffer.from(answer);
  const valid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  return valid
    ? { valid: true }
    : { valid: false, message: "Проверьте ответ на пример" };
};
