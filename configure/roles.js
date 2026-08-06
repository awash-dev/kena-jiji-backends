// Role constants — camelCase values match authMiddleware.js guards and
// the values stored in the users table.
const ROLES = {
  USER: "user",
  MERCHANT: "merchant",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
  DELIVERY_BOY: "deliveryBoy",
};

// Roles that must never be assignable via public/self-service endpoints.
const PRIVILEGED_ROLES = new Set([
  ROLES.MERCHANT,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.DELIVERY_BOY,
]);

// Roles a Super Admin may assign to other users.
const ASSIGNABLE_ROLES = [
  ROLES.USER,
  ROLES.MERCHANT,
  ROLES.ADMIN,
  ROLES.DELIVERY_BOY,
];

module.exports = { ROLES, PRIVILEGED_ROLES, ASSIGNABLE_ROLES };
