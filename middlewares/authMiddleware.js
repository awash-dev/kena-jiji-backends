const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const userRepository = require("../repositories/userRepository");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided in header." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findById(decoded?.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found. Please login again." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account blocked. Please contact support." });
    }

    req.user = { ...user, id: user._id };
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res
      .status(401)
      .json({ message: "Not Authorized, token expired. Please login again." });
  }
});

const requireRole = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next();
    }

    res.status(403);
    throw new Error("Access denied.");
  });

module.exports = {
  authMiddleware,
  isSuperAdmin: requireRole("superAdmin"),
  isAdmin: requireRole("admin"),
  isMerchant: requireRole("merchant"),
  isDeliveryBoy: requireRole("deliveryBoy"),
  isUser: requireRole("user"),
  isSuperAdminOrAdmin: requireRole("superAdmin", "admin"),
  isSuperAdminOrMerchant: requireRole("superAdmin", "merchant"),
  isAdminSuperAdminOrMerchant: requireRole("superAdmin", "merchant", "admin"),
  isSuperAdminOrMerchantOrAdmin: requireRole("superAdmin", "merchant", "admin"),
};
