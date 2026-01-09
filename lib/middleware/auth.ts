import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/mongodb/connect";
import User from "@/models/User";

export async function authenticateRequest(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role?: string;
} | null> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Fetch user role from database
  try {
    await connectDB();
    const user = await User.findById(payload.userId).select("role");
    if (user) {
      return {
        ...payload,
        role: user.role || "user",
      };
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
  }

  return payload;
}

export async function requireAuth(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role?: string;
}> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    throw new Error("Unauthorized");
  }
  return auth;
}

export async function requireAdmin(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
}> {
  const auth = await authenticateRequest(request);
  if (!auth) {
    throw new Error("Unauthorized");
  }

  if (auth.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return auth as { userId: string; email: string; role: string };
}

