const toCamel = (value) =>
  value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

const serializeRow = (row) => {
  if (!row) {
    return null;
  }

  const serialized = {};

  for (const [key, value] of Object.entries(row)) {
    const camelKey = toCamel(key);
    serialized[camelKey] = value;
    serialized[key] = value;
  }

  if (row.id && !serialized._id) {
    serialized._id = row.id;
  }

  if (serialized.postedbyuserid && !serialized.PostedByuserId) {
    serialized.PostedByuserId = serialized.postedbyuserid;
  }

  if (serialized.profilePicture && !serialized.ProfilePicture) {
    serialized.ProfilePicture = serialized.profilePicture;
  }

  if (serialized.tinNumber && !serialized.TinNumber) {
    serialized.TinNumber = serialized.tinNumber;
  }

  if (serialized.isread !== undefined && serialized.Isread === undefined) {
    serialized.Isread = serialized.isread;
  }

  if (serialized.productApproved && serialized.ProductApproved === undefined) {
    serialized.ProductApproved = serialized.productApproved;
  }

  if (serialized.postalCode !== undefined && serialized.postalCode !== null) {
    serialized.postalCode = Number(serialized.postalCode);
  }

  if (serialized.price !== undefined && serialized.price !== null) {
    serialized.price = Number(serialized.price);
  }

  if (serialized.oldPrice !== undefined && serialized.oldPrice !== null) {
    serialized.oldPrice = Number(serialized.oldPrice);
  }

  if (serialized.totalPrice !== undefined && serialized.totalPrice !== null) {
    serialized.totalPrice = Number(serialized.totalPrice);
  }

  if (
    serialized.totalPriceAfterDiscount !== undefined &&
    serialized.totalPriceAfterDiscount !== null
  ) {
    serialized.totalPriceAfterDiscount = Number(serialized.totalPriceAfterDiscount);
  }

  if (serialized.amount !== undefined && serialized.amount !== null) {
    serialized.amount = Number(serialized.amount);
  }

  if (serialized.discount !== undefined && serialized.discount !== null) {
    serialized.discount = Number(serialized.discount);
  }

  if (
    serialized.minOrderAmount !== undefined &&
    serialized.minOrderAmount !== null
  ) {
    serialized.minOrderAmount = Number(serialized.minOrderAmount);
  }

  if (
    serialized.maxDiscountAmount !== undefined &&
    serialized.maxDiscountAmount !== null
  ) {
    serialized.maxDiscountAmount = Number(serialized.maxDiscountAmount);
  }

  if (serialized.totalrating !== undefined && serialized.totalRating === undefined) {
    serialized.totalRating = Number(serialized.totalrating);
  }

  return serialized;
};

const serializeRows = (rows = []) => rows.map(serializeRow);

module.exports = {
  serializeRow,
  serializeRows,
};
