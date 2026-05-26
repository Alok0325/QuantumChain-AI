/**
 * Symmetric AES-256-GCM helpers for at-rest encryption of secrets
 * (e.g. exchange API keys).
 *
 * Storage format (base64): IV(12) || AUTH_TAG(16) || CIPHERTEXT
 *
 * The master key comes from process.env.KEY_VAULT_MASTER_KEY and must be
 * 64 lower-case hex chars (32 bytes). Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Rotating the key invalidates every previously-encrypted blob; plan migration.
 */
const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

let cachedKey = null;
let cachedKeySource = null;

function getKey(override) {
  if (override !== undefined && override !== null) {
    if (Buffer.isBuffer(override)) {
      if (override.length !== 32) {
        throw new Error("crypto: explicit Buffer key must be 32 bytes");
      }
      return override;
    }
    if (typeof override === "string" && /^[0-9a-f]{64}$/i.test(override)) {
      return Buffer.from(override, "hex");
    }
    throw new Error(
      "crypto: explicit key override must be a 64-char hex string or a 32-byte Buffer"
    );
  }
  const hex = process.env.KEY_VAULT_MASTER_KEY;
  if (cachedKey && cachedKeySource === hex) return cachedKey;
  if (!hex || !/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error(
      "KEY_VAULT_MASTER_KEY must be a 64-char lower-case hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  cachedKey = Buffer.from(hex, "hex");
  cachedKeySource = hex;
  return cachedKey;
}

exports.encrypt = (plaintext, keyOverride) => {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encrypt: plaintext must be a non-empty string");
  }
  const key = getKey(keyOverride);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
};

exports.decrypt = (encoded, keyOverride) => {
  if (typeof encoded !== "string" || encoded.length === 0) {
    throw new Error("decrypt: encoded must be a non-empty string");
  }
  const key = getKey(keyOverride);
  const buf = Buffer.from(encoded, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error("decrypt: ciphertext is malformed");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ct = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
};

exports.maskKey = (plaintext) => {
  if (!plaintext) return "";
  if (plaintext.length <= 8) return "*".repeat(plaintext.length);
  return `${plaintext.slice(0, 4)}…${plaintext.slice(-4)}`;
};

// HMAC-SHA256 signature for Binance signed requests (used in api-keys test path).
exports.binanceSignature = (queryString, apiSecret) =>
  crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
