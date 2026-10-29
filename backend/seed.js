require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();
  const department = process.env.ADMIN_DEPARTMENT?.trim();

  try {
    if (!email || !password || !name) {
      throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME to create an administrator.');
    }
    if (password.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      throw new Error(`An account already exists for ${email}. No account was changed.`);
    }

    await User.create({
      name,
      email,
      password,
      role: "admin",
      department: department || "Administration"
    });

    console.log(`Administrator created for ${email}.`);
  } catch (error) {
    console.error("Unable to create administrator:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
