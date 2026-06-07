import { createHash, randomBytes } from "node:crypto";

// Format klucza API: pauza_sk_<losowe>. Plaintext pokazujemy użytkownikowi RAZ,
// w bazie trzymamy tylko SHA-256 (key_hash) oraz prefiks do wyświetlenia na liście.
const KEY_PREFIX = "pauza_sk_";
const PREFIX_DISPLAY_LEN = KEY_PREFIX.length + 6; // np. "pauza_sk_a1b2c3"

export interface GeneratedKey {
  plaintext: string; // pełny klucz — pokaż raz, nie zapisuj
  hash: string; // SHA-256 do zapisania w api_keys.key_hash
  prefix: string; // fragment do wyświetlenia w UI (api_keys.key_prefix)
}

// SHA-256 (hex) z plaintextu klucza — deterministyczny, do zapisu i weryfikacji.
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

// Nowy klucz: ~43 znaki base64url losowości po prefiksie.
export function generateApiKey(): GeneratedKey {
  const plaintext = KEY_PREFIX + randomBytes(32).toString("base64url");
  return {
    plaintext,
    hash: hashApiKey(plaintext),
    prefix: plaintext.slice(0, PREFIX_DISPLAY_LEN),
  };
}
