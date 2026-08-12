const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Delete existing admin user if it exists
    const adminExists = await User.findOne({ email: "admin@company.com" });
    if (adminExists) {
      await User.deleteOne({ email: "admin@company.com" });
      console.log("? Existing admin user deleted");
    }

    // Create admin user
    const admin = new User({
      name: "Command Admin",
      email: "admin@company.com",
      password: "Admin@123", // Will be hashed by pre-save hook
      role: "admin",
      department: "IT Management"
    });

    await admin.save();
    console.log("? Admin user created successfully!");
    console.log("Email: admin@company.com");
    console.log("Password: Admin@123");
    console.log("Role: admin");
    console.log("Department: IT Management");
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
