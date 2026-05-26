const rateLimit = require("express-rate-limit");

const ipAndIdent = (req) => {
  const ident =
    req.body?.emailOrPhone ||
    req.body?.email ||
    req.body?.phone ||
    (req.user && req.user.id);
  return `${req.ip || req.connection?.remoteAddress || "unknown"}:${ident || "anon"}`;
};

const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: ipAndIdent,
    skipSuccessfulRequests: true, // failed attempts count; successful ones reset
    message: { success: false, code: "RATE_LIMITED", message },
  });

/** 5 failed attempts per 15 minutes per (IP, identifier). */
exports.loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again in 15 minutes.",
});

/** Tight limiter on 2FA enable/disable so codes aren't brute-forced. */
exports.twoFactorLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many 2FA attempts. Try again in 15 minutes.",
});
