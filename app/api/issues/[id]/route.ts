import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import IssueLog from "@/models/IssueLog";
import { authenticateRequest } from "@/lib/middleware/auth";
import mongoose from "mongoose";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
    }

    const issue = await IssueLog.findByIdAndDelete(id);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error: any) {
    console.error("Delete issue error:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}
