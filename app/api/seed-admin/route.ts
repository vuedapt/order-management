import { NextResponse } from "next/server";
import { ensureAdminExists } from "@/lib/utils/seedAdmin";

// GET - Check and seed admin if needed
export async function GET() {
  try {
    const success = await ensureAdminExists();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Admin account ensured" 
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to ensure admin account. Check environment variables." 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in seed-admin API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    );
  }
}

