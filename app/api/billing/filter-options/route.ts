import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Billing from "@/models/Billing";
import { authenticateRequest } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all non-archived billing entries
    const allBillingEntries = await Billing.find({ archived: false })
      .select("itemId itemName clientName orderOrderId")
      .lean();

    // Extract unique values for each filter field
    const itemIdsSet = new Set<string>();
    const itemNamesSet = new Set<string>();
    const clientNamesSet = new Set<string>();
    const orderOrderIdsSet = new Set<string>();

    for (const entry of allBillingEntries) {
      if (entry.itemId) itemIdsSet.add(entry.itemId);
      if (entry.itemName) itemNamesSet.add(entry.itemName);
      if (entry.clientName) clientNamesSet.add(entry.clientName);
      if (entry.orderOrderId) orderOrderIdsSet.add(entry.orderOrderId);
    }

    // Convert sets to sorted arrays
    const itemIds = Array.from(itemIdsSet).sort();
    const itemNames = Array.from(itemNamesSet).sort();
    const clientNames = Array.from(clientNamesSet).sort();
    const orderOrderIds = Array.from(orderOrderIdsSet).sort();

    return NextResponse.json({
      itemIds,
      itemNames,
      clientNames,
      orderOrderIds,
    });
  } catch (error: any) {
    console.error("Get billing filter options error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
