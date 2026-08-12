const fs = require("fs");
const path = require("path");
const userRepository = require("./repositories/userRepository");
const storeRepository = require("./repositories/storeRepository");
const productRepository = require("./repositories/productRepository");
const orderRepository = require("./repositories/orderRepository");
const db = require("./configure/wubFashionDB");
const { hashPassword } = require("./services/passwordService");
const { v4: uuidv4 } = require("uuid");

const sampleUsers = [
  {
    role: "superAdmin",
    firstname: "Super",
    lastname: "Admin",
    username: "superadmin",
    email: "superadmin@donsa.com",
    mobile: "+251900000001",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_superadmin",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    role: "admin",
    firstname: "System",
    lastname: "Admin",
    username: "sysadmin",
    email: "admin@donsa.com",
    mobile: "+251900000002",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_admin",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    role: "merchant",
    firstname: "Merkato",
    lastname: "Trader",
    username: "merkatotrader",
    email: "merchant@donsa.com",
    mobile: "+251900000003",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_merchant1",
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    role: "merchant",
    firstname: "Bole",
    lastname: "Boutique",
    username: "boleboutique",
    email: "merchant2@donsa.com",
    mobile: "+251900000004",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_merchant2",
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
  {
    role: "user",
    firstname: "Abebe",
    lastname: "Bikila",
    username: "abebebikila",
    email: "client@donsa.com",
    mobile: "+251900000005",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_client1",
        url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
      },
    ],
  },
];

async function seedAll() {
  console.log("Starting full database seed (5 Users, 5 Products, 5 Orders)...");
  let logOutput = "======================================================================\n";
  logOutput += "            ETHIO-MERKATO PLATFORM MASTER SEED DATA                   \n";
  logOutput += "======================================================================\n\n";

  // 1. Seed 5 Users
  logOutput += "--- 1. USERS (5 OF 5) ---\n";
  const createdUsers = [];
  for (let i = 0; i < sampleUsers.length; i++) {
    const u = sampleUsers[i];
    let existing = await userRepository.findOneByEmail(u.email);
    const hashedPassword = await hashPassword(u.password);
    let userId;

    if (existing) {
      userId = existing._id || existing.id;
      await userRepository.updateById(userId, {
        role: u.role,
        password: hashedPassword,
        is_email_verified: true,
        is_active: true,
      });
      existing = await userRepository.findById(userId);
      createdUsers.push(existing);
      console.log(`Updated user #${i + 1}: ${u.email} (${u.role})`);
    } else {
      const created = await userRepository.create({ ...u, password: hashedPassword });
      userId = created._id || created.id;
      createdUsers.push(created);
      console.log(`Created user #${i + 1}: ${u.email} (${u.role})`);
    }

    logOutput += `[USER #${i + 1}] Role: ${u.role.toUpperCase()} | Name: ${u.firstname} ${u.lastname} | Email: ${u.email} | Mobile: ${u.mobile} | Pass: ${u.password} | ID: ${userId}\n`;
  }

  const merchant1 = createdUsers.find((u) => u.email === "merchant@donsa.com") || createdUsers[2];
  const merchant1Id = merchant1._id || merchant1.id;
  const clientUser = createdUsers.find((u) => u.email === "client@donsa.com") || createdUsers[4];
  const clientUserId = clientUser._id || clientUser.id;

  // 2. Create Store
  let stores = await storeRepository.findByOwnerId(merchant1Id);
  let mainStore;
  if (!stores || stores.length === 0) {
    mainStore = await storeRepository.create({
      store_id: uuidv4(),
      store_name: "Merkato Main Store",
      owner_id: merchant1Id,
      address: "Addis Ababa, Merkato Center",
    });
  } else {
    mainStore = stores[0];
  }
  const storeId = mainStore._id || mainStore.id;

  // 3. Seed 5 Products
  logOutput += "\n--- 2. PRODUCTS (5 OF 5) ---\n";
  const sampleProducts = [
    {
      title: "Gucci Leather Shoulder Bag",
      slug: "gucci-leather-shoulder-bag-seed-5",
      description: "Handcrafted Italian leather shoulder bag with gold chain strap.",
      price: 4500.0,
      old_price: 5200.0,
      category: "Fashion",
      subcategory: "Bags",
      brand: "Gucci",
      quantity: 15,
      postedbyuserid: merchant1Id,
      store: storeId,
      product_approved: "approved",
      images: [{ public_id: "p1", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      title: "Nike Air Jordan High Retro",
      slug: "nike-air-jordan-high-retro-seed-5",
      description: "Classic high-top basketball sneakers featuring premium leather construction.",
      price: 6200.0,
      old_price: 7000.0,
      category: "Footwear",
      subcategory: "Sneakers",
      brand: "Nike",
      quantity: 20,
      postedbyuserid: merchant1Id,
      store: storeId,
      product_approved: "approved",
      images: [{ public_id: "p2", url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      title: "Designer Silk Summer Dress",
      slug: "designer-silk-summer-dress-seed-5",
      description: "Breathable pure silk midi dress with floral embroidery.",
      price: 3200.0,
      old_price: 3800.0,
      category: "Fashion",
      subcategory: "Dresses",
      brand: "Zara",
      quantity: 12,
      postedbyuserid: merchant1Id,
      store: storeId,
      product_approved: "approved",
      images: [{ public_id: "p3", url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      title: "Samsung Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra-seed-5",
      description: "Titanium frame 512GB flagship smartphone with S-Pen.",
      price: 85000.0,
      old_price: 92000.0,
      category: "Electronics",
      subcategory: "Mobiles",
      brand: "Samsung",
      quantity: 8,
      postedbyuserid: merchant1Id,
      store: storeId,
      product_approved: "approved",
      images: [{ public_id: "p4", url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80" }],
    },
    {
      title: "Apple MacBook Pro 16 M3 Max",
      slug: "apple-macbook-pro-16-m3-seed-5",
      description: "Space Black 36GB RAM 1TB SSD workhorse laptop for creators.",
      price: 145000.0,
      old_price: 160000.0,
      category: "Electronics",
      subcategory: "Laptops",
      brand: "Apple",
      quantity: 5,
      postedbyuserid: merchant1Id,
      store: storeId,
      product_approved: "approved",
      images: [{ public_id: "p5", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80" }],
    },
  ];

  const createdProducts = [];
  for (let i = 0; i < sampleProducts.length; i++) {
    const p = sampleProducts[i];
    let prod;
    try {
      const res = await db.query("SELECT * FROM products WHERE slug = $1 LIMIT 1", [p.slug]);
      if (res.rows.length > 0) {
        prod = res.rows[0];
      } else {
        prod = await productRepository.create(p);
      }
    } catch (e) {
      const res = await db.query("SELECT * FROM products WHERE slug = $1 LIMIT 1", [p.slug]);
      prod = res.rows[0];
    }
    createdProducts.push(prod);
    const pId = prod._id || prod.id;
    console.log(`Found/Created product #${i + 1}: ${prod.title} (${pId})`);
    logOutput += `[PRODUCT #${i + 1}] Title: ${prod.title} | Price: ${prod.price} ETB | Category: ${prod.category} | ID: ${pId}\n`;
  }

  // 4. Seed 5 Orders
  logOutput += "\n--- 3. ORDERS (5 OF 5) ---\n";
  const ts = Date.now();
  const sampleOrders = [
    {
      user_id: clientUserId,
      first_name: "Abebe",
      last_name: "Bikila",
      email: "client@donsa.com",
      phone_number: "+251900000005",
      address: "Bole Road, Addis Ababa",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal_code: "1000",
      tx_ref: `TX-COD-${ts}-1`,
      order_status: "placed",
      payment_method: "Cash on Delivery",
      total_price: 4500.0,
      total_price_after_discount: 4500.0,
      cart: [
        {
          product: createdProducts[0]._id || createdProducts[0].id,
          productTitle: createdProducts[0].title,
          price: 4500.0,
          count: 1,
        },
      ],
    },
    {
      user_id: clientUserId,
      first_name: "Abebe",
      last_name: "Bikila",
      email: "client@donsa.com",
      phone_number: "+251900000005",
      address: "Kazanchis, Addis Ababa",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal_code: "1000",
      tx_ref: `TX-CBE-${ts}-2`,
      order_status: "pending",
      payment_method: "Bank Transfer (CBE)",
      bank_receipt_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      total_price: 6200.0,
      total_price_after_discount: 6200.0,
      cart: [
        {
          product: createdProducts[1]._id || createdProducts[1].id,
          productTitle: createdProducts[1].title,
          price: 6200.0,
          count: 1,
        },
      ],
    },
    {
      user_id: clientUserId,
      first_name: "Abebe",
      last_name: "Bikila",
      email: "client@donsa.com",
      phone_number: "+251900000005",
      address: "Merkato, Addis Ababa",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal_code: "1000",
      tx_ref: `TX-TELEBIRR-${ts}-3`,
      order_status: "confirmed",
      payment_method: "Telebirr",
      total_price: 3200.0,
      total_price_after_discount: 3200.0,
      cart: [
        {
          product: createdProducts[2]._id || createdProducts[2].id,
          productTitle: createdProducts[2].title,
          price: 3200.0,
          count: 1,
        },
      ],
    },
    {
      user_id: clientUserId,
      first_name: "Abebe",
      last_name: "Bikila",
      email: "client@donsa.com",
      phone_number: "+251900000005",
      address: "Mexico Square, Addis Ababa",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal_code: "1000",
      tx_ref: `TX-BOA-${ts}-4`,
      order_status: "delivered",
      payment_method: "Bank Transfer (Bank of Abyssinia)",
      bank_receipt_url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80",
      total_price: 85000.0,
      total_price_after_discount: 85000.0,
      cart: [
        {
          product: createdProducts[3]._id || createdProducts[3].id,
          productTitle: createdProducts[3].title,
          price: 85000.0,
          count: 1,
        },
      ],
    },
    {
      user_id: clientUserId,
      first_name: "Abebe",
      last_name: "Bikila",
      email: "client@donsa.com",
      phone_number: "+251900000005",
      address: "Piassa, Addis Ababa",
      city: "Addis Ababa",
      country: "Ethiopia",
      postal_code: "1000",
      tx_ref: `TX-CHAPA-${ts}-5`,
      order_status: "completed",
      payment_method: "Chapa Payment Gateway",
      total_price: 145000.0,
      total_price_after_discount: 145000.0,
      cart: [
        {
          product: createdProducts[4]._id || createdProducts[4].id,
          productTitle: createdProducts[4].title,
          price: 145000.0,
          count: 1,
        },
      ],
    },
  ];

  for (let i = 0; i < sampleOrders.length; i++) {
    const o = sampleOrders[i];
    try {
      const createdOrder = await orderRepository.create(o);
      const oId = createdOrder._id || createdOrder.id || `ord_${i + 1}`;
      console.log(`Created order #${i + 1}: ${o.tx_ref} (${o.order_status})`);
      logOutput += `[ORDER #${i + 1}] Ref: ${o.tx_ref} | Status: ${o.order_status.toUpperCase()} | Method: ${o.payment_method} | Total: ${o.total_price} ETB | Order ID: ${oId}\n`;
      if (o.bank_receipt_url) {
        logOutput += `  └─ Bank Transfer Receipt Image: ${o.bank_receipt_url}\n`;
      }
    } catch (e) {
      console.error(`Error creating order #${i + 1}: `, e.message);
      logOutput += `[ORDER #${i + 1}] Ref: ${o.tx_ref} | Status: ${o.order_status.toUpperCase()} | Method: ${o.payment_method} | Total: ${o.total_price} ETB\n`;
    }
  }

  logOutput += "\n======================================================================\n";
  logOutput += "          DATABASE SEED COMPLETE: ALL 5/5 RECORDS CREATED           \n";
  logOutput += "======================================================================\n";

  const seedTxtPath = path.join(__dirname, "seed.txt");
  fs.writeFileSync(seedTxtPath, logOutput);
  console.log(`\nAll 5 Users, 5 Products, and 5 Orders seeded successfully!`);
  console.log(`Formatted seed summary saved to: ${seedTxtPath}`);
  process.exit(0);
}

seedAll().catch((err) => {
  console.error("Master seed error: ", err);
  process.exit(1);
});
