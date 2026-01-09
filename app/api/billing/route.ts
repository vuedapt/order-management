import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Billing from "@/models/Billing";
import { authenticateRequest } from "@/lib/middleware/auth";
import { getDateRangeFilter } from "@/lib/utils/dateTime";

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

    // Get paginated results
    const skip = (page - 1) * pageSize;
    const billingEntries = await Billing.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Transform to match frontend format
    const transformedEntries = billingEntries.map((entry: any) => ({
      id: entry._id.toString(),
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
    }));

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      billingEntries: transformedEntries,
      total,
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
