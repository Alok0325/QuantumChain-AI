const axios = require("axios");
const UserApiKeys = require("../../../Models/User/UserApiKeys");
const { encrypt, decrypt, maskKey, binanceSignature } = require("../../../Utils/crypto");

const EXCHANGE = "binance";

const publicShape = (row) => {
  if (!row) return { hasKeys: false, exchange: EXCHANGE };
  return {
    hasKeys: true,
    exchange: row.exchange,
    apiKeyMask: row.apiKeyMask,
    testedAt: row.testedAt,
    lastTestStatus: row.lastTestStatus,
    lastTestMessage: row.lastTestMessage,
    updatedAt: row.updatedAt,
  };
};

exports.getBinance = async (req, res) => {
  try {
    const row = await UserApiKeys.findOne({
      where: { userId: req.user.id, exchange: EXCHANGE },
    });
    return res.json({ success: true, data: publicShape(row) });
  } catch (err) {
    console.error("getBinance failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load API keys", error: err.message });
  }
};

exports.setBinance = async (req, res) => {
  const { apiKey, apiSecret } = req.body || {};
  if (!apiKey || !apiSecret || typeof apiKey !== "string" || typeof apiSecret !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "apiKey and apiSecret are required strings" });
  }
  if (apiKey.length < 8 || apiSecret.length < 8) {
    return res
      .status(400)
      .json({ success: false, message: "apiKey and apiSecret look too short" });
  }

  try {
    const [row, created] = await UserApiKeys.findOrCreate({
      where: { userId: req.user.id, exchange: EXCHANGE },
      defaults: {
        userId: req.user.id,
        exchange: EXCHANGE,
        apiKeyEnc: encrypt(apiKey),
        apiSecretEnc: encrypt(apiSecret),
        apiKeyMask: maskKey(apiKey),
      },
    });
    if (!created) {
      await row.update({
        apiKeyEnc: encrypt(apiKey),
        apiSecretEnc: encrypt(apiSecret),
        apiKeyMask: maskKey(apiKey),
        // Reset test state — old result no longer reflects the new keys.
        testedAt: null,
        lastTestStatus: null,
        lastTestMessage: null,
      });
    }
    return res.json({ success: true, data: publicShape(row) });
  } catch (err) {
    console.error("setBinance failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save API keys", error: err.message });
  }
};

exports.deleteBinance = async (req, res) => {
  try {
    await UserApiKeys.destroy({
      where: { userId: req.user.id, exchange: EXCHANGE },
    });
    return res.json({ success: true, data: { hasKeys: false, exchange: EXCHANGE } });
  } catch (err) {
    console.error("deleteBinance failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete API keys", error: err.message });
  }
};

exports.testBinance = async (req, res) => {
  let row;
  try {
    row = await UserApiKeys.findOne({
      where: { userId: req.user.id, exchange: EXCHANGE },
    });
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "No Binance API keys on file." });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to load API keys", error: err.message });
  }

  let apiKey, apiSecret;
  try {
    apiKey = decrypt(row.apiKeyEnc);
    apiSecret = decrypt(row.apiSecretEnc);
  } catch (err) {
    await row.update({
      testedAt: new Date(),
      lastTestStatus: "decrypt_failed",
      lastTestMessage: "Stored keys could not be decrypted — re-enter them.",
    });
    return res.status(500).json({
      success: false,
      message: "Stored keys failed to decrypt — re-enter them.",
    });
  }

  const ts = Date.now();
  const qs = `timestamp=${ts}&recvWindow=10000`;
  const sig = binanceSignature(qs, apiSecret);

  try {
    const r = await axios.get(`https://api.binance.com/api/v3/account?${qs}&signature=${sig}`, {
      headers: { "X-MBX-APIKEY": apiKey },
      timeout: 8000,
    });
    const balanceCount = Array.isArray(r.data?.balances) ? r.data.balances.length : 0;
    const canTrade = Boolean(r.data?.canTrade);
    await row.update({
      testedAt: new Date(),
      lastTestStatus: "ok",
      lastTestMessage: `Connected. canTrade=${canTrade}, ${balanceCount} balances.`,
    });
    // NEVER return decrypted secrets or actual balances.
    return res.json({
      success: true,
      data: {
        ...publicShape(row),
        canTrade,
        balanceCount,
      },
    });
  } catch (err) {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    const message =
      err.response?.data?.msg || err.message || "unknown Binance error";
    const failure =
      status === 401 || code === -2014 || code === -2015
        ? "invalid_key"
        : "network_error";
    await row.update({
      testedAt: new Date(),
      lastTestStatus: failure,
      lastTestMessage: message.slice(0, 400),
    });
    return res.status(status === 401 ? 401 : 502).json({
      success: false,
      message: `Binance test failed: ${message}`,
      data: publicShape(row),
    });
  }
};
