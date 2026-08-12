const fs = require("fs");
const path = require("path");
const userRepository = require("./repositories/userRepository");
const storeRepository = require("./repositories/storeRepository");
const productRepository = require("./repositories/productRepository");
const orderRepository = require("./repositories/orderRepository");
const { productCategoryRepository, brandRepository, productSubcategoryRepository } = require("./repositories/catalogRepositories");
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

const sampleCategories = ["Fashion", "Footwear", "Electronics", "Home & Living", "Beauty & Cosmetics"];
const sampleBrands = ["Gucci", "Nike", "Zara", "Samsung", "Apple"];
const sampleSubcategories = ["Bags", "Sneakers", "Dresses", "Mobiles", "Laptops"];

async function ensureSchemaExist() {
  console.log("Ensuring all database tables and schema exist...");
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        firstname VARCHAR(100),
        lastname VARCHAR(100),
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        profile_picture JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) UNIQUE NOT NULL,
        postedbyuserid VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) UNIQUE NOT NULL,
        postedbyuserid VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) UNIQUE NOT NULL,
        postedbyuserid VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id VARCHAR(255) UNIQUE NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        category VARCHAR(255),
        subcategory VARCHAR(255),
        brand VARCHAR(255),
        quantity INT DEFAULT 10,
        sold INT DEFAULT 0,
        images JSONB,
        colors JSONB,
        tags JSONB,
        postedbyuserid VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tx_ref VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        cart JSONB,
        total_price NUMERIC(12, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cod',
        order_status VARCHAR(50) DEFAULT 'placed',
        admin_approval_status VARCHAR(50) DEFAULT 'pending',
        bank_receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id VARCHAR(255) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS merchant_withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database tables and schema ensured successfully!");
  } catch (e) {
    console.error("Error ensuring schema:", e.message);
  }
}

async function seedAll() {
  await ensureSchemaExist();
  console.log("Starting full database seed (Categories, Brands, Users, Products, Orders)...");
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

  const superAdmin = createdUsers.find((u) => u.role === "superAdmin") || createdUsers[0];
  const superAdminId = superAdmin._id || superAdmin.id;
  const merchant1 = createdUsers.find((u) => u.email === "merchant@donsa.com") || createdUsers[2];
  const merchant1Id = merchant1._id || merchant1.id;
  const clientUser = createdUsers.find((u) => u.email === "client@donsa.com") || createdUsers[4];
  const clientUserId = clientUser._id || clientUser.id;

  // 2. Seed Product Categories
  logOutput += "\n--- 2. SHOP CATEGORIES (5 OF 5) ---\n";
  for (let i = 0; i < sampleCategories.length; i++) {
    const title = sampleCategories[i];
    try {
      const res = await db.query("SELECT * FROM product_categories WHERE title = $1 LIMIT 1", [title]);
      let catId;
      if (res.rows.length > 0) {
        catId = res.rows[0].id;
      } else {
        const cat = await productCategoryRepository.create({ title, postedbyuserid: superAdminId });
        catId = cat._id || cat.id;
      }
      console.log(`Category #${i + 1}: ${title} (${catId})`);
      logOutput += `[CATEGORY #${i + 1}] Title: ${title} | ID: ${catId}\n`;
    } catch (e) {
      console.log(`Category #${i + 1}: ${title}`);
      logOutput += `[CATEGORY #${i + 1}] Title: ${title}\n`;
    }
  }

  // 3. Seed Brands
  logOutput += "\n--- 3. BRANDS (5 OF 5) ---\n";
  for (let i = 0; i < sampleBrands.length; i++) {
    const title = sampleBrands[i];
    try {
      const res = await db.query("SELECT * FROM brands WHERE title = $1 LIMIT 1", [title]);
      let brandId;
      if (res.rows.length > 0) {
        brandId = res.rows[0].id;
      } else {
        const b = await brandRepository.create({ title, postedbyuserid: superAdminId });
        brandId = b._id || b.id;
      }
      console.log(`Brand #${i + 1}: ${title} (${brandId})`);
      logOutput += `[BRAND #${i + 1}] Title: ${title} | ID: ${brandId}\n`;
    } catch (e) {
      console.log(`Brand #${i + 1}: ${title}`);
      logOutput += `[BRAND #${i + 1}] Title: ${title}\n`;
    }
  }

  // 4. Seed Subcategories
  logOutput += "\n--- 4. SUBCATEGORIES (5 OF 5) ---\n";
  for (let i = 0; i < sampleSubcategories.length; i++) {
    const title = sampleSubcategories[i];
    try {
      const res = await db.query("SELECT * FROM product_subcategories WHERE title = $1 LIMIT 1", [title]);
      let subId;
      if (res.rows.length > 0) {
        subId = res.rows[0].id;
      } else {
        const sub = await productSubcategoryRepository.create({ title, postedbyuserid: superAdminId });
        subId = sub._id || sub.id;
      }
      console.log(`Subcategory #${i + 1}: ${title} (${subId})`);
      logOutput += `[SUBCATEGORY #${i + 1}] Title: ${title} | ID: ${subId}\n`;
    } catch (e) {
      console.log(`Subcategory #${i + 1}: ${title}`);
      logOutput += `[SUBCATEGORY #${i + 1}] Title: ${title}\n`;
    }
  }

  // 5. Create Store
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

  // 6. Seed 5 Products
  logOutput += "\n--- 5. PRODUCTS (5 OF 5) ---\n";
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

  // 7. Seed 5 Orders
  logOutput += "\n--- 6. ORDERS (5 OF 5) ---\n";
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
  logOutput += "          DATABASE SEED COMPLETE: ALL RECORDS CREATED           \n";
  logOutput += "======================================================================\n";

  const seedTxtPath = path.join(__dirname, "seed.txt");
  fs.writeFileSync(seedTxtPath, logOutput);
  console.log(`\nCategories, Brands, Subcategories, Users, Products, and Orders seeded successfully!`);
  console.log(`Formatted seed summary saved to: ${seedTxtPath}`);
  process.exit(0);
}

seedAll().catch((err) => {
  console.error("Master seed error: ", err);
  process.exit(1);
});
