const { generateToken } = require("../utils/createToken");
const sendVerificationEmail = require("../utils/emailSend");
const userRepository = require("../repositories/userRepository");
const { hashPassword } = require("../services/passwordService");
const { ROLES, PRIVILEGED_ROLES } = require("../configure/roles");

// Never trust a client-sent privileged role on registration.
const sanitizePublicRole = (role) => {
  if (!role || PRIVILEGED_ROLES.has(role)) return ROLES.USER;
  return role;
};

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, mobile } = req.body;
    const existingUser = await userRepository.findOneByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    const newUser = await userRepository.create({
      firstname: firstName,
      lastname: lastName,
      email,
      role: sanitizePublicRole(role),
      mobile: mobile || `${Date.now()}`,
      password: await hashPassword(`${Date.now()}`),
      is_email_verified: false,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${generateToken(newUser._id)}`;
    await sendVerificationEmail(newUser.email, resetUrl);

    res.status(201).json({ message: "User registered. Please verify your email." });
  } catch (error) {
    res.status(500).json({ error: "Error registering user." });
  }
};

module.exports = { registerUser };
