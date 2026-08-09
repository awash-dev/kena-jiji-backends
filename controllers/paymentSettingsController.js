const paymentSettingsRepository = require("../repositories/paymentSettingsRepository");

const getPaymentSettings = async (req, res) => {
  try {
    const settings = await paymentSettingsRepository.getSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePaymentSettings = async (req, res) => {
  try {
    const updated = await paymentSettingsRepository.updateSettings(req.body);
    res.status(200).json({ success: true, settings: updated, message: "Payment settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
};
