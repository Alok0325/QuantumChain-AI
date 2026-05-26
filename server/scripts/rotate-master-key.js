#!/usr/bin/env node
/**
 * Master-key rotation for the API-keys vault.
 *
 * Re-encrypts every UserApiKeys row from KEY_VAULT_OLD_KEY → KEY_VAULT_NEW_KEY,
 * one transaction per user so a mid-run crash leaves the DB in a coherent state.
 *
 * Usage:
 *   KEY_VAULT_OLD_KEY=<64-hex> KEY_VAULT_NEW_KEY=<64-hex> npm run rotate-keys
 *
 * After a successful run, replace KEY_VAULT_MASTER_KEY in server/.env with the
 * NEW key and restart the server.
 */
require("dotenv").config();
const { sequelize } = require("../importantInfo");
require("../Models/setModels"); // ensures all models are loaded
const UserApiKeys = require("../Models/User/UserApiKeys");
const { encrypt, decrypt } = require("../Utils/crypto");

const oldKey = process.env.KEY_VAULT_OLD_KEY;
const newKey = process.env.KEY_VAULT_NEW_KEY;

const HEX_RE = /^[0-9a-f]{64}$/i;

function assertHex(name, value) {
  if (!value || !HEX_RE.test(value)) {
    console.error(`✗ ${name} must be a 64-char hex string (32 bytes)`);
    process.exit(2);
  }
}

assertHex("KEY_VAULT_OLD_KEY", oldKey);
assertHex("KEY_VAULT_NEW_KEY", newKey);

if (oldKey.toLowerCase() === newKey.toLowerCase()) {
  console.error("✗ OLD and NEW keys are identical — nothing to rotate.");
  process.exit(2);
}

(async () => {
  await sequelize.authenticate();
  const rows = await UserApiKeys.findAll();
  if (rows.length === 0) {
    console.log("• No vault rows present. Nothing to rotate.");
    process.exit(0);
  }
  console.log(`• Rotating ${rows.length} row(s)…`);

  let rotated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const t = await sequelize.transaction();
    try {
      // Try to decrypt with old key. If that fails, the row may already be
      // on the new key — try that. If both fail, the row is poison — log and skip.
      let apiKey, apiSecret;
      try {
        apiKey = decrypt(row.apiKeyEnc, oldKey);
        apiSecret = decrypt(row.apiSecretEnc, oldKey);
      } catch (eOld) {
        try {
          decrypt(row.apiKeyEnc, newKey);
          await t.rollback();
          skipped++;
          console.log(`  → row ${row.id} already on new key, skipping`);
          continue;
        } catch (eNew) {
          await t.rollback();
          failed++;
          console.error(`  ✗ row ${row.id}: cannot decrypt with old or new key (${eOld.message})`);
          continue;
        }
      }

      const apiKeyEnc = encrypt(apiKey, newKey);
      const apiSecretEnc = encrypt(apiSecret, newKey);
      await row.update({ apiKeyEnc, apiSecretEnc }, { transaction: t });
      await t.commit();
      rotated++;
      console.log(`  ✓ row ${row.id} rotated (user=${row.userId})`);
    } catch (err) {
      await t.rollback();
      failed++;
      console.error(`  ✗ row ${row.id}: ${err.message}`);
    }
  }

  console.log(`\nResult: rotated=${rotated} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    console.error(
      "\n⚠️  Some rows failed to rotate. Investigate before swapping KEY_VAULT_MASTER_KEY."
    );
    process.exit(1);
  }
  console.log(
    "\n✓ Done. Replace KEY_VAULT_MASTER_KEY in server/.env with KEY_VAULT_NEW_KEY and restart."
  );
  process.exit(0);
})().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
