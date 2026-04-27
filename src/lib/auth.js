const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE_NAME = "repair_desk_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.REPAIR_DESK_SESSION_SECRET || "repair-desk-dev-secret-change-me";
}

export function getAuthUsers() {
  return [
    {
      username: process.env.REPAIR_DESK_OWNER_USERNAME || "er4gadgets",
      password: process.env.REPAIR_DESK_OWNER_PASSWORD || "Humberto11",
      displayName: process.env.REPAIR_DESK_OWNER_NAME || "Store Owner",
      role: "owner"
    },
    {
      username: process.env.REPAIR_DESK_STAFF_USERNAME || "staff",
      password: process.env.REPAIR_DESK_STAFF_PASSWORD || "staff1234",
      displayName: process.env.REPAIR_DESK_STAFF_NAME || "Staff",
      role: "staff"
    }
  ];
}

function normalizeCredential(value) {
  return String(value || "").trim().toLowerCase();
}

export function validateCredentials(username, password) {
  const normalizedUsername = normalizeCredential(username);
  const nextPassword = String(password || "");

  return (
    getAuthUsers().find(
      (user) =>
        normalizeCredential(user.username) === normalizedUsername && user.password === nextPassword
    ) || null
  );
}

function toBase64Url(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return decoder.decode(bytes);
}

async function signValue(value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(signature);
}

export async function createSessionToken(user) {
  const payload = {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    exp: Date.now() + SESSION_DURATION_MS
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(payloadPart);
  return `${payloadPart}.${signature}`;
}

export async function readSessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payloadPart, signature] = token.split(".");

  if (!payloadPart || !signature) {
    return null;
  }

  const expectedSignature = await signValue(payloadPart);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart));

    if (!payload?.username || !payload?.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch (_error) {
    return null;
  }
}

export function getSessionCookieConfig() {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION_MS / 1000
  };
}
