import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Billing from "@/models/Billing";
import { authenticateRequest } from "@/lib/middleware/auth";
import { getDateRangeFilter } from "@/lib/utils/dateTime";
import { generateBillId } from "@/lib/utils/billIdGenerator";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const itemId = searchParams.get("itemId") || "";
    const itemName = searchParams.get("itemName") || "";
    const clientName = searchParams.get("clientName") || "";
    const orderOrderId = searchParams.get("orderOrderId") || "";
    const timeRange = searchParams.get("timeRange") || "all";

    // Build query - exclude archived data
    const query: any = { archived: false };

    if (itemId) {
      query.itemId = { $regex: itemId, $options: "i" };
    }

    if (itemName) {
      query.itemName = { $regex: itemName, $options: "i" };
    }

    if (clientName) {
      query.clientName = { $regex: clientName, $options: "i" };
    }

    if (orderOrderId) {
      query.orderOrderId = { $regex: orderOrderId, $options: "i" };
    }

    // Time range filter
    if (timeRange !== "all") {
      const { start, end } = getDateRangeFilter(timeRange);
      query.createdAt = { $gte: start, $lte: end };
    }

    // Get total count
    const total = await Billing.countDocuments(query);

    // Get all billing entries matching the query (we'll group by billId)
    const allBillingEntries = await Billing.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // First, find the highest existing billId to start assigning from
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
          nextBillNumber = 999999; // Cap at max
        }
      }
    }

    // Group entries by billId
    // For entries without billId (legacy data), group by orderId + date + time
    // This ensures items billed together in the same transaction are grouped together
    const billsMap = new Map<string, any[]>();
    const legacyGroupMap = new Map<string, string>(); // Maps legacy group key to assigned billId
    
    for (const entry of allBillingEntries) {
      let billId = entry.billId;
      
      if (!billId || !billId.match(/^BILL\d{6}$/)) {
        // Legacy entry without proper billId - group by orderId + date + time
        const legacyKey = `${entry.orderOrderId}-${entry.date}-${entry.time}`;
        
        // Check if we've already assigned a billId to this legacy group
        if (!legacyGroupMap.has(legacyKey)) {
          // Assign a new proper billId to this legacy group
          const assignedBillId = `BILL${nextBillNumber.toString().padStart(6, "0")}`;
          legacyGroupMap.set(legacyKey, assignedBillId);
          billId = assignedBillId;
          nextBillNumber++;
          if (nextBillNumber > 999999) {
            nextBillNumber = 1; // Wrap around (shouldn't happen, but safety)
          }
        } else {
          billId = legacyGroupMap.get(legacyKey)!;
        }
      }
      
      if (!billsMap.has(billId)) {
        billsMap.set(billId, []);
      }
      billsMap.get(billId)!.push({
        id: entry._id.toString(),
        billId: billId,
        orderId: entry.orderId.toString(),
        orderOrderId: entry.orderOrderId,
        itemId: entry.itemId,
        itemName: entry.itemName,
        clientName: entry.clientName,
        billedStockCount: entry.billedStockCount,
        price: entry.price,
        totalAmount: entry.totalAmount,
        date: entry.date,
        time: entry.time,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }

    // Convert map to array of bills (each bill contains multiple items)
    const bills = Array.from(billsMap.entries()).map(([billId, entries]) => {
      // Sort entries by createdAt (most recent first within the bill)
      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Calculate total amount for the bill
      const billTotal = entries.reduce((sum, entry) => sum + entry.totalAmount, 0);
      
      // Get the first entry's metadata (all entries in a bill share the same date, time, client, order)
      const firstEntry = entries[0];
      
      return {
        billId,
        orderOrderId: firstEntry.orderOrderId,
        clientName: firstEntry.clientName,
        date: firstEntry.date,
        time: firstEntry.time,
        totalAmount: billTotal,
        items: entries,
        createdAt: firstEntry.createdAt,
        updatedAt: firstEntry.updatedAt,
      };
    });

    // Sort bills by createdAt (most recent first)
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination to bills (not individual entries)
    const totalBills = bills.length;
    const skip = (page - 1) * pageSize;
    const paginatedBills = bills.slice(skip, skip + pageSize);
    const totalPages = Math.ceil(totalBills / pageSize);

    return NextResponse.json({
      bills: paginatedBills,
      total: totalBills,
      page,
      pageSize,
      totalPages,
    });
  } catch (error: any) {
    console.error("Get billing entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing entries" },
      { status: 500 }
    );
  }
}
