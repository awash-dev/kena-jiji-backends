const db = require("../configure/wubFashionDB");
const { serializeRow } = require("../services/sqlHelpers");

const getSettings = async () => {
  let result = await db.query("SELECT * FROM payment_settings ORDER BY created_at ASC LIMIT 1");
  if (!result.rows.length) {
    result = await db.query(
      `INSERT INTO payment_settings (cod_enabled, bank_transfer_enabled, chapa_enabled, bank_name, bank_account_name, bank_account_number, bank_instructions)
       VALUES (TRUE, TRUE, TRUE, 'CBE (Commercial Bank of Ethiopia)', 'Ethio-Merkato E-Commerce', '1000123456789', 'Transfer exact order amount to the bank account above and upload receipt photo.')
       RETURNING *`
    );
  }
  return serializeRow(result.rows[0]);
};

const updateSettings = async (payload) => {
  const current = await getSettings();
  const {
    cod_enabled = current.codEnabled,
    bank_transfer_enabled = current.bankTransferEnabled,
    chapa_enabled = current.chapaEnabled,
    bank_name = current.bankName,
    bank_account_name = current.bankAccountName,
    bank_account_number = current.bankAccountNumber,
    bank_instructions = current.bankInstructions,
  } = payload;

  const result = await db.query(
    `UPDATE payment_settings
     SET cod_enabled = $1, bank_transfer_enabled = $2, chapa_enabled = $3, bank_name = $4, bank_account_name = $5, bank_account_number = $6, bank_instructions = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      cod_enabled,
      bank_transfer_enabled,
      chapa_enabled,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_instructions,
      current._id || current.id,
    ]
  );

  return serializeRow(result.rows[0]);
};

module.exports = {
  getSettings,
  updateSettings,
};
