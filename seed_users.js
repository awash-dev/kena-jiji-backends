const fs = require("fs");
const path = require("path");
const userRepository = require("./repositories/userRepository");
const { hashPassword } = require("./services/passwordService");

const usersToSeed = [
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
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    role: "merchant",
    firstname: "Merchant",
    lastname: "One",
    username: "merchantone",
    email: "merchant@donsa.com",
    mobile: "+251900000002",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_merchant",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  {
    role: "user",
    firstname: "Client",
    lastname: "One",
    username: "clientone",
    email: "client@donsa.com",
    mobile: "+251900000003",
    password: "Password@123",
    is_email_verified: true,
    is_active: true,
    profile_picture: [
      {
        public_id: "avatar_client",
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
      }
    ]
  }
];

async function seedUsers() {
  console.log("Seeding users...");
  let outData = "Seed User Data:\n\n";

  for (const u of usersToSeed) {
    const existingUser = await userRepository.findOneByEmail(u.email);
    if (existingUser) {
      console.log(`User ${u.email} already exists. Updating role and profile picture.`);
      const hashedPassword = await hashPassword(u.password);
      await userRepository.updateById(existingUser._id || existingUser.id, {
        role: u.role,
        password: hashedPassword,
        is_email_verified: true,
        is_active: true,
        profile_picture: u.profile_picture
      });
      outData += `Role: ${u.role}\nEmail: ${u.email}\nPassword: ${u.password}\n\n`;
      continue;
    }

    const hashedPassword = await hashPassword(u.password);
    const payload = {
      ...u,
      password: hashedPassword
    };

    try {
      const created = await userRepository.create(payload);
      console.log(`Created user: ${created.email} as ${created.role}`);
      outData += `Role: ${u.role}\nEmail: ${u.email}\nPassword: ${u.password}\n\n`;
    } catch (e) {
      console.error(`Error creating user ${u.email}: `, e.message);
    }
  }

  const outPath = path.join(__dirname, "..", "user-data.txt");
  fs.writeFileSync(outPath, outData);
  console.log(`User data saved to ${outPath}`);
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
