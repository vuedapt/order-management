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

// PUT - Update issue (mark as resolved or update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Handle both sync and async params (Next.js 15+ uses async)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const body = await request.json();
    const { resolved } = body;

    const issue = await Issue.findByIdAndUpdate(
      id,
      { resolved: resolved !== undefined ? resolved : true },
      { new: true }
    );

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: issue._id.toString(),
      row: issue.row,
      itemId: issue.itemId,
      error: issue.error,
      timestamp: issue.createdAt,
      resolved: issue.resolved,
    });
  } catch (error: any) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Handle both sync and async params (Next.js 15+ uses async)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

