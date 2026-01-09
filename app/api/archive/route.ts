import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import Billing from "@/models/Billing";
import Inventory from "@/models/Inventory";
import IssueLog from "@/models/IssueLog";
import { requireAdmin } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    // Only admins can archive data
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

    await connectDB();

    // Get current date/time - archive all data created before now
    const archiveDate = new Date();

    // Archive Orders
    const ordersResult = await Order.updateMany(
      { archived: false, createdAt: { $lt: archiveDate } },
      { $set: { archived: true } }
    );

    // Archive Billings
    const billingsResult = await Billing.updateMany(
      { archived: false, createdAt: { $lt: archiveDate } },
      { $set: { archived: true } }
    );

    // Archive Inventory
    const inventoryResult = await Inventory.updateMany(
      { archived: false, createdAt: { $lt: archiveDate } },
      { $set: { archived: true } }
    );

    // Archive IssueLogs
    const issueLogsResult = await IssueLog.updateMany(
      { archived: false, createdAt: { $lt: archiveDate } },
      { $set: { archived: true } }
    );

    const totalArchived =
      ordersResult.modifiedCount +
      billingsResult.modifiedCount +
      inventoryResult.modifiedCount +
      issueLogsResult.modifiedCount;

    return NextResponse.json({
      message: "Data archived successfully",
      archivedCount: totalArchived,
      details: {
        orders: ordersResult.modifiedCount,
        billings: billingsResult.modifiedCount,
        inventory: inventoryResult.modifiedCount,
        issueLogs: issueLogsResult.modifiedCount,
      },
    });
  } catch (error: any) {
    console.error("Archive error:", error);
    return NextResponse.json(
      { error: "Failed to archive data" },
      { status: 500 }
    );
  }
}

