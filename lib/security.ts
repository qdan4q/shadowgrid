const encoder = new TextEncoder();
const PASSWORD_ITERATIONS = 120_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function secureId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint8Array(12));
  return `${prefix}_${bytesToBase64Url(random)}`;
}

export function createSessionToken(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashPassword(
  password: string,
  suppliedSalt?: string,
  iterations = PASSWORD_ITERATIONS,
): Promise<{ hash: string; salt: string; iterations: number }> {
  const saltBytes = suppliedSalt
    ? base64UrlToBytes(suppliedSalt)
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes as BufferSource, iterations },
    key,
    256,
  );
  return { hash: bytesToBase64Url(new Uint8Array(bits)), salt: bytesToBase64Url(saltBytes), iterations };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
): Promise<boolean> {
  const calculated = await hashPassword(password, salt, iterations);
  const expected = base64UrlToBytes(expectedHash);
  const actual = base64UrlToBytes(calculated.hash);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) mismatch |= actual[index] ^ expected[index];
  return mismatch === 0;
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === "string" && /password|token|secret/iu.test(item)) return "[REDACTED]";
    return item;
  });
}
