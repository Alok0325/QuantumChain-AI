const speakeasy = require("speakeasy");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../../../Models/User/users");

const ISSUER = process.env.TWO_FACTOR_ISSUER || "QuantumChain AI";
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LEN = 8;
// Lower-cost bcrypt for backup codes — they are high-entropy (~41 bits) so
// extreme bcrypt cost is unnecessary and slow when verifying.
const BACKUP_BCRYPT_COST = 8;

/** Generate one human-readable backup code: 8 hex chars in two groups of 4. */
function generateBackupCode() {
  const raw = crypto.randomBytes(BACKUP_CODE_LEN / 2).toString("hex").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function hashBackupCodes(codes) {
  return Promise.all(codes.map((c) => bcrypt.hash(c, BACKUP_BCRYPT_COST)));
}

exports.getStatus = async (req, res) => {
  return res.json({
    success: true,
    data: {
      enabled: Boolean(req.user.twoFactorEnabled),
      backupCodesRemaining: Array.isArray(req.user.twoFactorBackupCodes)
        ? req.user.twoFactorBackupCodes.length
        : 0,
    },
  });
};

exports.setup = async (req, res) => {
  if (req.user.twoFactorEnabled) {
    return res.status(409).json({
      success: false,
      message: "2FA is already enabled. Disable it first to re-provision.",
    });
  }
  try {
    const secret = speakeasy.generateSecret({
      name: `${ISSUER}:${req.user.email || req.user.phone}`,
      issuer: ISSUER,
      length: 20,
    });
    await req.user.update({ twoFactorSecret: secret.base32, twoFactorEnabled: false });
    return res.json({
      success: true,
      data: {
        otpauthUrl: secret.otpauth_url,
        secret: secret.base32,
        issuer: ISSUER,
      },
    });
  } catch (err) {
    console.error("2fa.setup failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to setup 2FA", error: err.message });
  }
};

exports.enable = async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, message: "code is required" });
  }
  if (!req.user.twoFactorSecret) {
    return res.status(409).json({
      success: false,
      message: "Run /setup first to provision a secret.",
    });
  }
  const ok = speakeasy.totp.verify({
    secret: req.user.twoFactorSecret,
    encoding: "base32",
    token: String(code),
    window: 1,
  });
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid code" });
  }
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const hashed = await hashBackupCodes(plain);
  await req.user.update({ twoFactorEnabled: true, twoFactorBackupCodes: hashed });
  // Backup codes are returned in plaintext exactly once.
  return res.json({
    success: true,
    data: { enabled: true, backupCodes: plain },
  });
};

exports.regenerateBackupCodes = async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ success: false, message: "password is required" });
  }
  if (!req.user.twoFactorEnabled) {
    return res.status(409).json({
      success: false,
      message: "2FA must be enabled before regenerating backup codes.",
    });
  }
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: "Incorrect password" });
  const plain = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const hashed = await hashBackupCodes(plain);
  await user.update({ twoFactorBackupCodes: hashed });
  return res.json({ success: true, data: { backupCodes: plain } });
};

exports.disable = async (req, res) => {
  const { password, code } = req.body || {};
  if (!password || !code) {
    return res
      .status(400)
      .json({ success: false, message: "password and code are required" });
  }
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const pwOk = await bcrypt.compare(password, user.password);
  if (!pwOk) {
    return res.status(401).json({ success: false, message: "Incorrect password" });
  }
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.json({ success: true, data: { enabled: false } });
  }
  const codeOk = await verifyAnyCode(user, code);
  if (!codeOk) {
    return res.status(401).json({ success: false, message: "Invalid code" });
  }
  await user.update({
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: null,
  });
  return res.json({ success: true, data: { enabled: false } });
};

/**
 * Verify a code as either a TOTP or a single-use backup code.
 * On a successful backup-code match, mutates the user to consume the code
 * (so it can't be re-used) and persists the new array.
 *
 * Exported for the login controller to share the same logic.
 */
async function verifyAnyCode(user, codeRaw) {
  const code = String(codeRaw).trim();
  if (!code) return false;
  // 1. TOTP path
  if (/^\d{6}$/.test(code) && user.twoFactorSecret) {
    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (ok) return true;
  }
  // 2. Backup-code path. Normalize: strip dashes/spaces, uppercase.
  const codes = Array.isArray(user.twoFactorBackupCodes)
    ? user.twoFactorBackupCodes
    : [];
  if (codes.length === 0) return false;
  const normalised = code.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-F0-9]{8}$/.test(normalised)) return false;
  const display = `${normalised.slice(0, 4)}-${normalised.slice(4, 8)}`;
  for (let i = 0; i < codes.length; i++) {
    if (await bcrypt.compare(display, codes[i])) {
      const remaining = [...codes];
      remaining.splice(i, 1);
      await user.update({ twoFactorBackupCodes: remaining });
      return true;
    }
  }
  return false;
}

exports.verifyAnyCode = verifyAnyCode;
