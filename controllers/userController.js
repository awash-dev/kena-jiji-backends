const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const uniqid = require("uniqid");
const { validationResult } = require("express-validator");
const { generateToken } = require("../utils/createToken");
const { generateRefreshToken } = require("../utils/refreshtoken");
const sendEmail = require("../utils/sendEmail");
const validateMongoDbId = require("../utils/validateMongoDbId");
const userRepository = require("../repositories/userRepository");
const productRepository = require("../repositories/productRepository");
const cartRepository = require("../repositories/cartRepository");
const orderRepository = require("../repositories/orderRepository");
const { hashPassword, comparePassword, createHashedOTP } = require("../services/passwordService");
const { ROLES, PRIVILEGED_ROLES, ASSIGNABLE_ROLES } = require("../configure/roles");

const generateOTPPassword = () => Math.floor(100000 + Math.random() * 900000).toString();

// Public registration must NEVER create a privileged account. Any client-sent
// privileged role is forced back to the default client role.
const sanitizePublicRole = (role) => {
  if (!role || PRIVILEGED_ROLES.has(role)) return ROLES.USER;
  return role;
};

const createUser = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, role, mobile } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await userRepository.findOneByEmail(normalizedEmail);
  if (existingUser) throw new Error("User already exists with this email.");

  const otpPassword = generateOTPPassword();
  const emailVerification = createHashedOTP();
  const newUser = await userRepository.create({
    firstname,
    lastname,
    email: normalizedEmail,
    role: sanitizePublicRole(role),
    mobile,
    password: await hashPassword(otpPassword),
    email_verification_otp: emailVerification.hashedOtp,
    email_verification_expires: emailVerification.expiresAt,
  });

  const token = generateToken(newUser._id);
  const resetUrl = `${process.env.base_url}reset-password?token=${token}`;
  const message = `Your OTP for email verification is: ${emailVerification.otp}\nYour reset link is: ${resetUrl}\nYour temporary password is: ${otpPassword}`;

  await sendEmail({ email: normalizedEmail, subject: "Email Verification OTP", message });

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please verify your email using the OTP sent to your email.",
    user: {
      _id: newUser._id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      mobile: newUser.mobile,
      role: newUser.role,
    },
  });
});

const createAppUser = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, password, mobile, role } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await userRepository.findOneByEmail(normalizedEmail);
  if (existingUser) throw new Error("User already exists with this email.");

  const verification = createHashedOTP();
  const newUser = await userRepository.create({
    firstname,
    lastname,
    email: normalizedEmail,
    password: await hashPassword(password),
    mobile,
    role: sanitizePublicRole(role),
    email_verification_otp: verification.hashedOtp,
    email_verification_expires: verification.expiresAt,
  });

  await sendEmail({
    email: newUser.email,
    subject: "Email Verification OTP",
    message: `Your OTP for email verification is: ${verification.otp}`,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please verify your email using the OTP sent to your email.",
    user: {
      _id: newUser._id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      mobile: newUser.mobile,
      role: newUser.role,
    },
  });
});

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: "fail", message: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await userRepository.findById(decoded.userId);

    if (!user) return res.status(404).json({ status: "fail", message: "User not found" });
    if (!(await comparePassword(currentPassword, user.password))) {
      return res.status(400).json({ status: "fail", message: "Current password is incorrect" });
    }

    await userRepository.updateById(user._id, {
      password: await hashPassword(newPassword),
      password_changed_at: new Date(),
    });

    return res.status(200).json({ status: "success", message: "Password reset successfully" });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: "Invalid or expired token" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userRepository.findOneByEmail(email);
    if (!user || !user.emailVerificationExpires || new Date(user.emailVerificationExpires).getTime() <= Date.now()) {
      return res.status(400).json({ message: "OTP is invalid or has expired" });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOTP !== user.emailVerificationOtp) return res.status(400).json({ message: "Incorrect OTP" });

    await userRepository.updateById(user._id, {
      is_email_verified: true,
      email_verification_otp: null,
      email_verification_expires: null,
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await userRepository.findOneByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ message: "User not found with this email" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified" });

    const verification = createHashedOTP();
    await userRepository.updateById(user._id, {
      email_verification_otp: verification.hashedOtp,
      email_verification_expires: verification.expiresAt,
    });

    await sendEmail({
      email: user.email,
      subject: "Email Verification OTP",
      message: `Your new OTP for email verification is: ${verification.otp}`,
    });

    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await userRepository.findOneByEmail(req.body.email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const otpPassword = generateOTPPassword();
  const passwordReset = createHashedOTP();
  const token = generateToken(user._id);
  const resetUrl = `${process.env.base_url}reset-password?token=${token}`;

  await userRepository.updateById(user._id, {
    password: await hashPassword(otpPassword),
    password_reset_otp: passwordReset.hashedOtp,
    password_reset_expires: passwordReset.expiresAt,
  });

  const message = `Your OTP for email verification is: ${passwordReset.otp}\n${resetUrl}\nYour temporary password is: ${otpPassword}`;
  await sendEmail({ email: user.email, subject: "Password Reset OTP", message });
  res.status(200).json({ message: "OTP has been sent to your email." });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await userRepository.findOneByEmail(email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  if (user.passwordResetOtp !== hashedOTP || !user.passwordResetExpires || Date.now() > new Date(user.passwordResetExpires).getTime()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  res.status(200).json({ message: "OTP verified. You can now reset your password." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await userRepository.findOneByEmail(email);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!newPassword) return res.status(400).json({ message: "New password is required" });

  await userRepository.updateById(user._id, {
    password: await hashPassword(newPassword),
    password_reset_otp: null,
    password_reset_expires: null,
  });

  res.status(200).json({ message: "Password reset successfully. You can now log in." });
});

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }
  const findUser = await userRepository.findOneByEmail(email);
  if (!findUser) {
    res.status(401);
    throw new Error("Invalid Credentials");
  }
  if (!findUser.isEmailVerified) {
    res.status(401);
    throw new Error("Please verify your email before logging in.");
  }
  if (findUser.isBlocked) {
    res.status(403);
    throw new Error("Your account has been blocked. Please contact support.");
  }
  if (!(await comparePassword(password, findUser.password))) {
    res.status(401);
    throw new Error("Invalid Credentials");
  }

  const refreshToken = await generateRefreshToken(findUser._id);
  await userRepository.updateById(findUser._id, { refresh_token: refreshToken });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, maxAge: 72 * 60 * 60 * 1000 });

  res.json({
    _id: findUser._id,
    firstname: findUser.firstname,
    lastname: findUser.lastname,
    email: findUser.email,
    mobile: findUser.mobile,
    role: findUser.role,
    profile_picture: findUser.profilePicture || findUser.profile_picture || [],
    token: generateToken(findUser._id),
  });
});

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const user = await userRepository.findOneByRefreshToken(cookie.refreshToken);
  if (!user) throw new Error(" No Refresh token present in db or not matched");

  jwt.verify(cookie.refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user._id !== decoded.id) throw new Error("There is something wrong with refresh token");
    res.json({ accessToken: generateToken(user._id) });
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const user = await userRepository.findOneByRefreshToken(cookie.refreshToken);
  if (user) await userRepository.updateById(user._id, { refresh_token: "" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.sendStatus(204);
});

const updatedUser = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user?._id;
  const profile = req.body.profileInfo || req.body;
  // Only a Super Admin may change roles through the update endpoint.
  const isSuperAdmin = req.user?.role === "superAdmin";

  // Build the update payload from only the fields actually provided so
  // partial updates never send undefined to Postgres (which would 500).
  const patch = {};
  for (const [key, value] of Object.entries({
    firstname: profile.firstname,
    lastname: profile.lastname,
    username: profile.username,
    mobile: profile.mobile,
    email: profile.email,
    address: profile.address,
    profile_picture: profile.ProfilePicture || profile.profilePicture,
    ...(isSuperAdmin && profile.role ? { role: profile.role } : {}),
    is_active: profile.isActive,
    is_blocked: profile.isBlocked,
  })) {
    if (value !== undefined) patch[key] = value;
  }

  const user = await userRepository.updateById(userId, patch);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({ message: "Profile updated successfully", user });
});

// Dedicated Super Admin role-switch endpoint.
const changeUserRole = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: "Role is required" });
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Allowed: ${ASSIGNABLE_ROLES.join(", ")}` });
  }

  const user = await userRepository.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Safety guards: no self-demotion and never demote the last Super Admin.
  if (String(req.params.id) === String(req.user?._id)) {
    return res.status(400).json({ message: "You cannot change your own role." });
  }
  if (user.role === "superAdmin") {
    const counts = await userRepository.countByRole();
    const superAdminRow = counts.find((c) => c.role === "superAdmin");
    if (!superAdminRow || Number(superAdminRow.count) <= 1) {
      return res.status(400).json({ message: "Cannot demote the last Super Admin." });
    }
  }

  const updated = await userRepository.updateById(req.params.id, { role });
  res.status(200).json({
    success: true,
    message: `Role updated to ${role}`,
    user: updated,
  });
});

const saveAddress = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  const updatedUser = await userRepository.updateById(req.user._id, { address: req?.body?.address });
  res.json(updatedUser);
});

const getallUser = asyncHandler(async (req, res) => res.json(await userRepository.findAll()));

const getaUser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json({ getaUser: await userRepository.findById(req.params.id) });
});

const deleteaUser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json({ deleteaUser: await userRepository.deleteById(req.params.id) });
});

const blockUser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await userRepository.updateById(req.params.id, { is_blocked: true }));
});

const unblockUser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await userRepository.updateById(req.params.id, { is_blocked: false });
  res.json({ message: "User UnBlocked" });
});

const getDeliveryBoys = async (req, res) => res.status(200).json(await userRepository.findByRole("deliveryBoy"));

const getProfile = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

const assignOrderToDeliveryBoy = async (req, res) => {
  const order = await orderRepository.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found." });
  await orderRepository.updateById(req.params.orderId, { assigned_to: req.body.deliveryBoyId, order_status: "assigned" });
  res.status(200).json({ success: true, message: "Order assigned to delivery boy." });
};

const updateDeliveryBoy = async (req, res) => {
  res.status(200).json(await userRepository.updateById(req.params.id, {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    mobile: req.body.mobile,
    role: req.body.role,
    address: req.body.address,
    is_active: req.body.isActive,
    is_blocked: req.body.isBlocked,
  }));
};

const deleteDeliveryBoy = async (req, res) => {
  await userRepository.deleteById(req.params.id);
  res.status(204).json({ message: "Delivery boy deleted successfully." });
};

const updatePassword = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  if (req.body.password) {
    return res.json(await userRepository.updateById(req.user._id, {
      password: await hashPassword(req.body.password),
      password_changed_at: new Date(),
    }));
  }
  res.json(await userRepository.findById(req.user._id));
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const user = await userRepository.findOneByEmail(req.body.email);
  if (!user) throw new Error("User not found with this email");
  const token = uniqid();
  await userRepository.updateById(user._id, {
    password_reset_token: token,
    password_reset_expires: new Date(Date.now() + 10 * 60 * 1000),
  });
  sendEmail({
    to: req.body.email,
    text: "Hey User",
    subject: "Forgot Password Link",
    htm: `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</>`,
  });
  res.json(token);
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  const products = await Promise.all((user.wishlist || []).map((id) => productRepository.findById(id)));
  res.json({ ...user, wishlist: products.filter(Boolean) });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId is required" });
  const user = await userRepository.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const wishlist = Array.isArray(user.wishlist) ? user.wishlist.filter(Boolean) : [];
  if (wishlist.includes(productId)) return res.status(400).json({ message: "Product already in wishlist" });
  wishlist.push(productId);
  await userRepository.updateById(req.user._id, { wishlist });
  res.status(201).json({ message: "Product added to wishlist successfully" });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  await userRepository.updateById(req.user._id, {
    wishlist: (user.wishlist || []).filter((item) => item !== req.params.id),
  });
  res.json({ message: "Product removed from wishlist successfully" });
});

const userCart = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  res.json(await cartRepository.create({
    user_id: req.user._id,
    product_id: req.body.productId,
    color: req.body.color,
    price: req.body.price,
    quantity: req.body.quantity,
  }));
});

const getUserCart = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  res.json(await cartRepository.findByUser(req.user._id));
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  res.json(await cartRepository.deleteByUserAndCartId(req.user._id, req.params.cartItemId));
});

const emptyCart = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  res.json(await cartRepository.deleteManyByUser(req.user._id));
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user._id);
  const cartItem = await cartRepository.findByIdAndUser(req.user._id, req.params.cartItemId);
  if (!cartItem) return res.status(404).json({ message: "Cart item not found" });
  res.json(await cartRepository.updateById(req.params.cartItemId, { quantity: Number(req.params.newQuantity) }));
});

const createOrder = asyncHandler(async (req, res) => {
  const { totalPrice, currency, email, first_name, last_name, phone_number, address, country, city, postalCode, callback_url, totalPriceAfterDiscount, return_url, cart } = req.body;
  if (!first_name || !last_name || !phone_number || !country) {
    return res.status(400).json({ message: "Validation error: Missing required fields" });
  }

  validateMongoDbId(req.user._id);
  const savedOrder = await orderRepository.create({
    user_id: req.user._id,
    currency,
    first_name,
    last_name,
    email,
    phone_number,
    address,
    city,
    postal_code: postalCode,
    tx_ref: "pending for eyob-12",
    cart: cart || [],
    callback_url,
    return_url,
    country,
    total_price: totalPrice,
    total_price_after_discount: totalPriceAfterDiscount,
    payment_info: {},
  });
  res.status(201).json({ message: "Order created successfully", order: savedOrder });
});

const getMyOrders = asyncHandler(async (req, res) => res.json({ orders: await orderRepository.findByUser(req.user._id) }));
const getAllOrders = asyncHandler(async (req, res) => res.json({ orders: await orderRepository.findAll() }));
const getsingleOrder = asyncHandler(async (req, res) => res.json({ orders: await orderRepository.findById(req.params.id) }));

const updateOrder = async (req, res) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ status: "error", message: "Order not found" });
    let assignedTo = order.assignedTo?._id || order.assignedTo || null;
    if (req.body.deliveryBoyId) {
      const deliveryBoy = await userRepository.findById(req.body.deliveryBoyId);
      if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
        return res.status(404).json({ status: "error", message: "Delivery Boy not found" });
      }
      assignedTo = req.body.deliveryBoyId;
    }
    const updatedOrder = await orderRepository.updateById(req.params.id, {
      assigned_to: assignedTo,
      order_status: req.body.status || order.orderStatus,
    });
    return res.json({ status: "success", message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => res.json(await orderRepository.monthlyIncome()));
const getYearlyTotalOrder = asyncHandler(async (req, res) => res.json(await orderRepository.yearlyTotals()));

const getUsersByRole = asyncHandler(async (req, res) => {
  if (!req.query.role) return res.status(400).json({ message: "Role query parameter is required" });
  const users = await userRepository.findByRole(req.query.role);
  if (!users.length) return res.status(404).json({ message: `No users found with role ${req.query.role}` });
  res.status(200).json({ success: true, users });
});

const getSupportUser = asyncHandler(async (req, res) => {
  const admins = await userRepository.findByRole("admin");
  if (admins.length) {
    const a = admins[0];
    return res.status(200).json({ _id: a._id || a.id, name: a.firstname, role: a.role });
  }
  const supers = await userRepository.findByRole("superAdmin");
  if (supers.length) {
    const s = supers[0];
    return res.status(200).json({ _id: s._id || s.id, name: s.firstname, role: s.role });
  }
  res.status(404).json({ message: "No support admin available" });
});

const getUserCount = async (req, res) => {
  try {
    const counts = (await userRepository.countByRole()).reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {});
    res.status(200).json({
      success: true,
      data: {
        merchant: counts.merchant || 0,
        admin: counts.admin || 0,
        deliveryBoy: counts.deliveryBoy || 0,
        user: counts.user || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user counts", error: error.message });
  }
};

module.exports = {
  createUser,
  createAppUser,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyOTP,
  resetPassword,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  saveAddress,
  userCart,
  getUserCart,
  createOrder,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getAllOrders,
  getsingleOrder,
  updateOrder,
  getYearlyTotalOrder,
  removeProductFromCart,
  updateProductQuantityFromCart,
  getDeliveryBoys,
  getProfile,
  assignOrderToDeliveryBoy,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  changePassword,
  getUsersByRole,
  getUserCount,
  changeUserRole,
  getSupportUser,
};
