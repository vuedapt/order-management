import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import User from "@/models/User";
import { ensureAdminExists } from "@/lib/utils/seedAdmin";

export async function GET() {
  try {
    // Check if any admin already exists
    await connectDB();
    const existingAdmin = await User.findOne({ role: "admin" });
    
    // If admin exists, require authentication to re-seed
    if (existingAdmin) {
      // For security, we can make this require admin auth if needed
      // But for initial setup, we allow it without auth
      // You can uncomment the following if you want to require auth for re-seeding:
      /*
      const { requireAdmin } = await import("@/lib/middleware/auth");
      const { NextRequest } = await import("next/server");
      try {
        await requireAdmin(request);
      } catch (error: any) {
        return NextResponse.json({ error: "Admin already exists. Re-seeding requires admin authentication." }, { status: 403 });
      }
      */
    }
    
    const success = await ensureAdminExists();
    if (success) {
      return NextResponse.json({ message: "Admin account ready" });
    } else {
      return NextResponse.json(
        { error: "Failed to seed admin. Check environment variables." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error seeding admin:", error);
    return NextResponse.json(
      { error: "Failed to seed admin" },
      { status: 500 }
    );
  }
}

