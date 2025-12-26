import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Issue from "@/models/Issue";
import { verifyToken } from "@/lib/auth/jwt";

async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return null;
  }
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// GET - Fetch all unresolved issues
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const issues = await Issue.find({ resolved: false })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      issues: issues.map((issue: any) => ({
        id: issue._id.toString(),
        row: issue.row,
        itemId: issue.itemId,
        error: issue.error,
        timestamp: issue.createdAt,
        resolved: issue.resolved,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new issue
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { row, itemId, error } = body;

    if (!row || !error) {
      return NextResponse.json(
        { error: "Row and error are required" },
        { status: 400 }
      );
    }

    const issue = new Issue({
      row,
      itemId: itemId || "",
      error,
      resolved: false,
    });

    await issue.save();

    return NextResponse.json({
      id: issue._id.toString(),
      row: issue.row,
      itemId: issue.itemId,
      error: issue.error,
      timestamp: issue.createdAt,
      resolved: issue.resolved,
    });
  } catch (error: any) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

