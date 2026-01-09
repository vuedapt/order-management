import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth";
import { ensureAdminExists } from "@/lib/utils/seedAdmin";

export async function GET(request: NextRequest) {
  try {
    // Only allow admins to trigger seed-admin
    try {
      await requireAdmin(request);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Admin access required")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
      throw error;
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

