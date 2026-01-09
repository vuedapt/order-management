import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import IssueLog from "@/models/IssueLog";
import { authenticateRequest } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const issues = await IssueLog.find({ resolved: false, archived: false })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match frontend format
    const transformedIssues = issues.map((issue: any) => ({
      id: issue._id.toString(),
      row: issue.row,
      itemId: issue.itemId || "",
      error: issue.error,
      timestamp: issue.createdAt,
      resolved: issue.resolved,
    }));

    return NextResponse.json(transformedIssues);
  } catch (error: any) {
    console.error("Get issues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { row, itemId, error } = body;

    if (!row || !error) {
      return NextResponse.json(
        { error: "row and error are required" },
        { status: 400 }
      );
    }

    const issue = new IssueLog({
      row: parseInt(row),
      itemId: itemId || "",
      error,
      resolved: false,
    });

    await issue.save();

    const transformedIssue = {
      id: issue._id.toString(),
      row: issue.row,
      itemId: issue.itemId || "",
      error: issue.error,
      timestamp: issue.createdAt,
      resolved: issue.resolved,
    };

    return NextResponse.json(transformedIssue, { status: 201 });
  } catch (error: any) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
