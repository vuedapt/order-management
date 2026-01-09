import connectDB from "@/lib/mongodb/connect";
import User from "@/models/User";

export async function ensureAdminExists(): Promise<boolean> {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("[SeedAdmin] ADMIN_EMAIL and ADMIN_PASSWORD not set in environment variables");
      return false;
    }

    // Check if admin already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      // Ensure existing admin has admin role
      if (existingUser.role !== "admin") {
        existingUser.role = "admin";
        await existingUser.save();
        console.log("[SeedAdmin] Updated existing user to admin role");
      } else {
        console.log("[SeedAdmin] Admin account already exists");
      }
      return true;
    }

    // Create new admin user
    const user = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "admin",
    });

    await user.save();
    console.log("[SeedAdmin] Admin account created successfully");
    return true;
  } catch (error: any) {
    console.error("[SeedAdmin] Error ensuring admin exists:", error.message);
    return false;
  }
}

