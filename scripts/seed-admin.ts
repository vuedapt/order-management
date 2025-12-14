/**
 * Seed script to create the admin account
 * Run this script once to create the admin user account
 * 
 * Usage: pnpm seed:admin
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import User from "../models/User";

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), ".env") });

const mongoUri = process.env.MONGODB_URI;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

if (!mongoUri) {
  console.error("Error: MONGODB_URI must be set in .env");
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

    console.log("Creating admin account...");
    console.log(`Email: ${adminEmail}`);

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      console.log("Admin account already exists. No action needed.");
      await mongoose.disconnect();
      return;
    }

    // Create new user
    const user = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
    });

    await user.save();
    console.log("Admin account created successfully!");
    console.log(`User ID: ${user._id.toString()}`);

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error: any) {
    console.error("Error creating admin account:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
