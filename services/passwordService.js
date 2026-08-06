const bcrypt = require("bcrypt");
const crypto = require("crypto");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (enteredPassword, passwordHash) =>
  bcrypt.compare(enteredPassword, passwordHash);

const createHashedOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  return {
    otp,
    hashedOtp: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  createHashedOTP,
};
