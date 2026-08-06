const storeRepository = require("./repositories/storeRepository");
const productRepository = require("./repositories/productRepository");
const userRepository = require("./repositories/userRepository");
const { v4: uuidv4 } = require("uuid");

async function seedStoresAndProducts() {
  console.log("Seeding stores and products...");

  // Find merchant user
  const merchant = await userRepository.findOneByEmail("merchant@donsa.com");
  if (!merchant) {
    console.error("Merchant user (merchant@donsa.com) not found! Run node seed_users.js first.");
    process.exit(1);
  }

  const merchantId = merchant._id || merchant.id;

  // Check existing stores
  let stores = await storeRepository.findByOwnerId(merchantId);
  let mainStore;

  if (!stores || stores.length === 0) {
    console.log("Creating default store for merchant@donsa.com...");
    mainStore = await storeRepository.create({
      store_id: uuidv4(),
      store_name: "Merkato Main Store",
      owner_id: merchantId,
      address: "Addis Ababa, Merkato Center",
    });
    console.log(`Created store: ${mainStore.store_name} (${mainStore.id})`);
  } else {
    mainStore = stores[0];
    console.log(`Found existing store: ${mainStore.store_name} (${mainStore.id})`);
  }

  const storeId = mainStore._id || mainStore.id;

  const productsToSeed = [
    {
      title: "Gucci Leather Shoulder Bag",
      slug: "gucci-leather-shoulder-bag",
      description: "Elegant handcrafted Italian leather shoulder bag with gold chain strap.",
      price: 4500.0,
      old_price: 5200.0,
      category: "Fashion",
      subcategory: "Bags",
      brand: "Gucci",
      quantity: 15,
      sold: 3,
      postedbyuserid: merchantId,
      store: storeId,
      product_approved: "approved",
      images: [
        {
          public_id: "bag_1",
          url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
        },
      ],
      colors: [{ color: "Black", images: [] }],
      tags: ["handbag", "leather", "luxury"],
    },
    {
      title: "Nike Air Jordan High Retro",
      slug: "nike-air-jordan-high-retro",
      description: "Classic high-top basketball sneakers featuring premium leather construction.",
      price: 6200.0,
      old_price: 7000.0,
      category: "Footwear",
      subcategory: "Sneakers",
      brand: "Nike",
      quantity: 20,
      sold: 8,
      postedbyuserid: merchantId,
      store: storeId,
      product_approved: "approved",
      images: [
        {
          public_id: "snk_1",
          url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
        },
      ],
      colors: [{ color: "Red/White", images: [] }],
      tags: ["sneakers", "nike", "footwear"],
    },
    {
      title: "Designer Silk Summer Dress",
      slug: "designer-silk-summer-dress",
      description: "Breathable pure silk midi dress with floral embroidery.",
      price: 3200.0,
      old_price: 3800.0,
      category: "Fashion",
      subcategory: "Dresses",
      brand: "Zara",
      quantity: 12,
      sold: 5,
      postedbyuserid: merchantId,
      store: storeId,
      product_approved: "approved",
      images: [
        {
          public_id: "dr_1",
          url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&auto=format&fit=crop&q=80",
        },
      ],
      colors: [{ color: "Floral Pink", images: [] }],
      tags: ["silk", "dress", "summer"],
    },
    {
      title: "Premium Vintage Denim Jacket",
      slug: "premium-vintage-denim-jacket",
      description: "Heavyweight 100% cotton washed denim jacket with bronze button closures.",
      price: 2800.0,
      old_price: 3500.0,
      category: "Fashion",
      subcategory: "Jackets",
      brand: "Levi's",
      quantity: 8,
      sold: 1,
      postedbyuserid: merchantId,
      store: storeId,
      product_approved: "pending",
      images: [
        {
          public_id: "jk_1",
          url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        },
      ],
      colors: [{ color: "Blue", images: [] }],
      tags: ["denim", "jacket", "vintage"],
    },
  ];

  for (const prod of productsToSeed) {
    const existing = await productRepository.findAll({ filters: { slug: prod.slug } });
    if (existing && existing.length > 0) {
      console.log(`Product "${prod.title}" already exists. Updating store & images.`);
      await productRepository.updateById(existing[0]._id || existing[0].id, prod);
    } else {
      const created = await productRepository.create(prod);
      console.log(`Created product: ${created.title}`);
    }
  }

  console.log("Seeding stores and products completed successfully!");
  process.exit(0);
}

seedStoresAndProducts().catch((err) => {
  console.error("Failed seeding stores and products:", err);
  process.exit(1);
});
