const fs = require("fs");
const path = require("path");
const db = require("./configure/wubFashionDB");
const userRepository = require("./repositories/userRepository");
const blogRepository = require("./repositories/blogRepository");
const promotionRepository = require("./repositories/promotionRepository");
const {
  blogCategoryRepository,
  blogSubcategoryRepository,
  couponRepository,
} = require("./repositories/catalogRepositories");
const { hashPassword } = require("./services/passwordService");

// Ad (blog) categories shown in the Super Admin "Ads" dropdown.
const AD_TYPES = ["Home Ads", "Popup", "Sliding"];

// Ad subcategories for finer placement.
const AD_SUBTYPES = ["Hero Banner", "Carousel", "Announcement"];

const sampleAds = [
  {
    title: "Grand Opening Mega Sale — Homepage Banner",
    description:
      "Up to 50% off across the whole marketplace. Shop the home banner offer before it ends.",
    category: "Home Ads",
    subcategory: "Hero Banner",
    author: "Kena Studio",
    images: [
      {
        public_id: "ad_home_1",
        url: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    title: "Flash Deal Popup — Sign Up For 10% Off",
    description:
      "Grab a one-time 10% welcome discount by signing up today. Limited to the first 1,000 customers.",
    category: "Popup",
    subcategory: "Announcement",
    author: "Kena Studio",
    images: [
      {
        public_id: "ad_popup_1",
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    title: "New Season Arrivals — Sliding Carousel",
    description:
      "Discover the freshest fashion, electronics and home goods in our rotating featured slider.",
    category: "Sliding",
    subcategory: "Carousel",
    author: "Kena Studio",
    images: [
      {
        public_id: "ad_sliding_1",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
];

const samplePromos = [
  {
    code: "TEN10",
    title: "10 Days Discount",
    discount_type: "percentage",
    amount: 10,
    expiration_date: addDays(new Date(), 10),
    min_order_amount: 500,
    max_discount_amount: 5000,
    active: true,
  },
  {
    code: "MEGA20",
    title: "Mega 20% Flash Sale",
    discount_type: "percentage",
    amount: 20,
    expiration_date: addDays(new Date(), 7),
    min_order_amount: 1000,
    max_discount_amount: 10000,
    active: true,
  },
];

const sampleCoupons = [
  { name: "KENA10", expiry: addDays(new Date(), 30), discount: 10 },
  { name: "WELCOME15", expiry: addDays(new Date(), 45), discount: 15 },
  { name: "MERKATO5", expiry: addDays(new Date(), 60), discount: 5 },
];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function findOrCreateByTitle(repo, table, title, postedbyuserid) {
  const res = await db.query(`SELECT * FROM ${table} WHERE title = $1 LIMIT 1`, [title]);
  if (res.rows.length > 0) {
    return { row: res.rows[0], created: false };
  }
  const created = await repo.create({ title, postedbyuserid });
  return { row: created, created: true };
}

async function getOrCreateSuperAdmin() {
  const existing = await userRepository.findByRole("superAdmin");
  if (existing && existing.length > 0) return existing[0];

  const byEmail = await userRepository.findOneByEmail("superadmin@donsa.com");
  if (byEmail) return byEmail;

  const hashedPassword = await hashPassword("Password@123");
  return userRepository.create({
    role: "superAdmin",
    firstname: "Super",
    lastname: "Admin",
    username: "superadmin",
    email: "superadmin@donsa.com",
    mobile: "+251900000001",
    password: hashedPassword,
    is_email_verified: true,
    is_active: true,
  });
}

async function seedAdsPromosCoupons() {
  console.log("Seeding ads types, promotions and coupons...");
  let logOutput = "======================================================================\n";
  logOutput += "         ETHIO-MERKATO ADS / PROMOS / COUPONS SEED                    \n";
  logOutput += "======================================================================\n\n";

  const superAdmin = await getOrCreateSuperAdmin();
  const superAdminId = superAdmin._id || superAdmin.id;

  // 1. Blog categories (ad types)
  logOutput += `--- 1. AD TYPES / BLOG CATEGORIES (${AD_TYPES.length}) ---\n`;
  for (let i = 0; i < AD_TYPES.length; i++) {
    const title = AD_TYPES[i];
    try {
      const { row, created } = await findOrCreateByTitle(
        blogCategoryRepository,
        "blog_categories",
        title,
        superAdminId
      );
      const id = row._id || row.id;
      console.log(`${created ? "Created" : "Exists"} ad type #${i + 1}: ${title} (${id})`);
      logOutput += `[AD TYPE #${i + 1}] ${title} | ${created ? "CREATED" : "EXISTS"} | ID: ${id}\n`;
    } catch (e) {
      console.log(`Ad type #${i + 1}: ${title}`);
      logOutput += `[AD TYPE #${i + 1}] ${title}\n`;
    }
  }

  // 2. Blog subcategories
  logOutput += `\n--- 2. AD SUBTYPES / BLOG SUBCATEGORIES (${AD_SUBTYPES.length}) ---\n`;
  for (let i = 0; i < AD_SUBTYPES.length; i++) {
    const title = AD_SUBTYPES[i];
    try {
      const { row, created } = await findOrCreateByTitle(
        blogSubcategoryRepository,
        "blog_subcategories",
        title,
        superAdminId
      );
      const id = row._id || row.id;
      console.log(`${created ? "Created" : "Exists"} ad subtype #${i + 1}: ${title} (${id})`);
      logOutput += `[AD SUBTYPE #${i + 1}] ${title} | ${created ? "CREATED" : "EXISTS"} | ID: ${id}\n`;
    } catch (e) {
      console.log(`Ad subtype #${i + 1}: ${title}`);
      logOutput += `[AD SUBTYPE #${i + 1}] ${title}\n`;
    }
  }

  // 3. Sample ads (blogs)
  logOutput += `\n--- 3. SAMPLE ADS (${sampleAds.length}) ---\n`;
  for (let i = 0; i < sampleAds.length; i++) {
    const ad = sampleAds[i];
    try {
      const res = await db.query("SELECT * FROM blogs WHERE title = $1 LIMIT 1", [ad.title]);
      let row;
      if (res.rows.length > 0) {
        row = res.rows[0];
        console.log(`Ad #${i + 1} exists: ${ad.title}`);
      } else {
        row = await blogRepository.create({ ...ad, postedbyuserid: superAdminId });
        console.log(`Created ad #${i + 1}: ${ad.title}`);
      }
      const id = row._id || row.id;
      logOutput += `[AD #${i + 1}] ${ad.title} | Type: ${ad.category} | ID: ${id}\n`;
    } catch (e) {
      console.error(`Error creating ad #${i + 1}:`, e.message);
      logOutput += `[AD #${i + 1}] ${ad.title} | ERROR: ${e.message}\n`;
    }
  }

  // 4. Promotions
  logOutput += `\n--- 4. PROMOTIONS (${samplePromos.length}) ---\n`;
  for (let i = 0; i < samplePromos.length; i++) {
    const promo = samplePromos[i];
    try {
      const res = await db.query("SELECT * FROM promotions WHERE code = $1 LIMIT 1", [promo.code]);
      let row;
      if (res.rows.length > 0) {
        row = res.rows[0];
        console.log(`Promo #${i + 1} exists: ${promo.code} (${promo.title})`);
      } else {
        row = await promotionRepository.create({
          code: promo.code,
          discount_type: promo.discount_type,
          amount: promo.amount,
          expiration_date: promo.expiration_date,
          min_order_amount: promo.min_order_amount,
          max_discount_amount: promo.max_discount_amount,
          product_ids: [],
          active: promo.active,
          created_by: superAdminId,
        });
        console.log(`Created promo #${i + 1}: ${promo.code} (${promo.title})`);
      }
      const id = row._id || row.id;
      logOutput += `[PROMO #${i + 1}] Code: ${promo.code} | ${promo.title} | Discount: ${
        promo.discount_type === "percentage" ? `${promo.amount}%` : `${promo.amount} ETB`
      } | Expires: ${promo.expiration_date.toISOString().slice(0, 10)} | ID: ${id}\n`;
    } catch (e) {
      console.error(`Error creating promo #${i + 1}:`, e.message);
      logOutput += `[PROMO #${i + 1}] Code: ${promo.code} | ERROR: ${e.message}\n`;
    }
  }

  // 5. Coupons
  logOutput += `\n--- 5. COUPONS (${sampleCoupons.length}) ---\n`;
  for (let i = 0; i < sampleCoupons.length; i++) {
    const coupon = sampleCoupons[i];
    try {
      const res = await db.query("SELECT * FROM coupons WHERE name = $1 LIMIT 1", [coupon.name]);
      let row;
      if (res.rows.length > 0) {
        row = res.rows[0];
        console.log(`Coupon #${i + 1} exists: ${coupon.name}`);
      } else {
        row = await couponRepository.create({
          name: coupon.name,
          expiry: coupon.expiry,
          discount: coupon.discount,
          postedbyuserid: superAdminId,
        });
        console.log(`Created coupon #${i + 1}: ${coupon.name}`);
      }
      const id = row._id || row.id;
      logOutput += `[COUPON #${i + 1}] Code: ${coupon.name} | Discount: ${coupon.discount}% | Expires: ${coupon.expiry
        .toISOString()
        .slice(0, 10)} | ID: ${id}\n`;
    } catch (e) {
      console.error(`Error creating coupon #${i + 1}:`, e.message);
      logOutput += `[COUPON #${i + 1}] Code: ${coupon.name} | ERROR: ${e.message}\n`;
    }
  }

  logOutput += "\n======================================================================\n";
  logOutput += "        ADS / PROMOS / COUPONS SEED COMPLETE                        \n";
  logOutput += "======================================================================\n";

  const seedTxtPath = path.join(__dirname, "seed_ads_promos_coupons.txt");
  fs.writeFileSync(seedTxtPath, logOutput);
  console.log("\nAds types, promotions and coupons seeded successfully!");
  console.log(`Seed summary saved to: ${seedTxtPath}`);
  process.exit(0);
}

seedAdsPromosCoupons().catch((err) => {
  console.error("Ads/Promos/Coupons seed error:", err);
  process.exit(1);
});
