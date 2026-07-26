// scripts/seedSuperAdmin.js
//
// Creates (or updates) the first super_admin account so you can log in.
// There is no public sign-up in Fidem — this is the only way to get your
// first account. After that, use "Invite Admin" in the app to add more.
//
// Usage:
//   cd server
//   node scripts/seedSuperAdmin.js you@example.com "Your Name" "a-strong-password"

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { AdminModel, ROLES } = require("../models/master");

async function main() {
  const [, , email, name, password] = process.argv;

  if (!email || !name || !password) {
    console.error(
      'Usage: node scripts/seedSuperAdmin.js you@example.com "Your Name" "a-strong-password"'
    );
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Check your .env file.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await AdminModel.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    {
      $set: {
        email: email.toLowerCase().trim(),
        name,
        role: ROLES.SUPER_ADMIN,
        status: "active",
        passwordHash,
        emailVerified: true,
      },
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Super admin ready: ${admin.email} (id: ${admin._id})`);
  console.log("You can now log in at /admin/login with this email and password.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed super admin:", err);
  process.exit(1);
});
