const { createSimpleCrudRepository } = require("./simpleCrudRepository");

module.exports = {
  brandRepository: createSimpleCrudRepository({
    table: "brands",
    allowedFields: ["title", "postedbyuserid"],
  }),
  colorRepository: createSimpleCrudRepository({
    table: "colors",
    allowedFields: ["title", "postedbyuserid"],
  }),
  productCategoryRepository: createSimpleCrudRepository({
    table: "product_categories",
    allowedFields: ["title", "postedbyuserid"],
  }),
  productSubcategoryRepository: createSimpleCrudRepository({
    table: "product_subcategories",
    allowedFields: ["title", "postedbyuserid"],
  }),
  blogCategoryRepository: createSimpleCrudRepository({
    table: "blog_categories",
    allowedFields: ["title", "postedbyuserid"],
  }),
  blogSubcategoryRepository: createSimpleCrudRepository({
    table: "blog_subcategories",
    allowedFields: ["title", "postedbyuserid"],
  }),
  tagRepository: createSimpleCrudRepository({
    table: "tags",
    allowedFields: ["title", "postedbyuserid"],
  }),
  sizeRepository: createSimpleCrudRepository({
    table: "sizes",
    allowedFields: ["title", "postedbyuserid"],
  }),
  couponRepository: createSimpleCrudRepository({
    table: "coupons",
    allowedFields: ["name", "expiry", "discount", "postedbyuserid"],
  }),
  fqaRepository: createSimpleCrudRepository({
    table: "fqas",
    allowedFields: ["name", "email", "mobile", "comment", "status", "postedbyuserid"],
  }),
  packageRepository: createSimpleCrudRepository({
    table: "packages",
    allowedFields: ["name", "duration", "amount", "created_by_user_id"],
  }),
};
