import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Billing from "@/models/Billing";
import { requireAdmin } from "@/lib/middleware/auth";
import { generateBillId } from "@/lib/utils/billIdGenerator";

export async function POST(request: NextRequest) {
  try {
    // Only admins can run migrations
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

    // Find all billing entries without billId or with invalid billId format
    const entriesWithoutBillId = await Billing.find({
      $or: [
        { billId: { $exists: false } },
        { billId: null },
        { billId: "" },
        { billId: { $not: { $regex: /^BILL\d{6}$/ } } },
      ],
    }).sort({ createdAt: 1 }); // Sort by creation date to maintain chronological order

    if (entriesWithoutBillId.length === 0) {
      return NextResponse.json({
        message: "All billing entries already have valid billIds",
        migrated: 0,
      });
    }

    // Group entries by orderOrderId + date + time to assign same billId to items billed together
    const groupedEntries = new Map<string, typeof entriesWithoutBillId>();
    
    for (const entry of entriesWithoutBillId) {
      const groupKey = `${entry.orderOrderId}-${entry.date}-${entry.time}`;
      if (!groupedEntries.has(groupKey)) {
        groupedEntries.set(groupKey, []);
      }
      groupedEntries.get(groupKey)!.push(entry);
    }

    // Find the highest existing billId to start from
    const highestBill = await Billing.findOne({
      billId: { $regex: /^BILL\d{6}$/ }
    })
      .sort({ billId: -1 })
      .select("billId")
      .lean();
    
    let nextBillNumber = 1;
    if (highestBill && highestBill.billId) {
      const match = highestBill.billId.match(/^BILL(\d{6})$/);
      if (match) {
        nextBillNumber = parseInt(match[1], 10) + 1;
        if (nextBillNumber > 999999) {
          return NextResponse.json(
            { error: "Bill ID limit reached (999999)" },
            { status: 400 }
          );
        }
      }
    }

    // Assign billIds to each group
    let migratedCount = 0;
    const migrationResults: Array<{
      groupKey: string;
      billId: string;
      entriesCount: number;
    }> = [];

    for (const [groupKey, entries] of groupedEntries.entries()) {
      const assignedBillId = `BILL${nextBillNumber.toString().padStart(6, "0")}`;
      
      // Update all entries in this group with the same billId
      const entryIds = entries.map(e => e._id);
      const updateResult = await Billing.updateMany(
        { _id: { $in: entryIds } },
        { $set: { billId: assignedBillId } }
      );

      migratedCount += updateResult.modifiedCount;
      migrationResults.push({
        groupKey,
        billId: assignedBillId,
        entriesCount: entries.length,
      });

      nextBillNumber++;
      if (nextBillNumber > 999999) {
        return NextResponse.json(
          { 
            error: "Bill ID limit reached during migration",
            migrated: migratedCount,
            results: migrationResults,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      message: `Successfully migrated ${migratedCount} billing entries`,
      migrated: migratedCount,
      groups: groupedEntries.size,
      results: migrationResults.slice(0, 10), // Return first 10 results as sample
    });
  } catch (error: any) {
    console.error("Migrate billIds error:", error);
    return NextResponse.json(
      { error: "Failed to migrate billIds", details: error.message },
      { status: 500 }
    );
  }
}
