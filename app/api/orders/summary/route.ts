import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import { verifyToken } from "@/lib/auth/jwt";
import { formatDateIST } from "@/lib/utils/dateTime";

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

function getDateRangeFilter(timeRange: string) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  let startDate: Date;
  
  switch (timeRange) {
    case "today":
      startDate = new Date(Date.UTC(
        istNow.getUTCFullYear(),
        istNow.getUTCMonth(),
        istNow.getUTCDate(),
        0, 0, 0, 0
      ));
      startDate = new Date(startDate.getTime() - istOffset);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1m":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }
  
  return { createdAt: { $gte: startDate } };
}

// GET - Get summary data
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId") || "";
    const itemName = searchParams.get("itemName") || "";
    const clientName = searchParams.get("clientName") || "";
    const timeRange = searchParams.get("timeRange") || "all";

    // Build filter query
    const filter: any = {};
    
    if (itemId.trim()) {
      filter.itemId = { $regex: itemId.trim(), $options: "i" };
    }
    
    if (itemName.trim()) {
      filter.itemName = { $regex: itemName.trim(), $options: "i" };
    }
    
    if (clientName.trim()) {
      filter.clientName = { $regex: clientName.trim(), $options: "i" };
    }
    
    if (timeRange !== "all") {
      Object.assign(filter, getDateRangeFilter(timeRange));
    }

    // Get all orders matching filters (no pagination)
    const orders = await Order.find(filter).lean();

    // Summary by Item (group by itemId and itemName)
    const summaryByItemMap: Record<string, { itemId: string; itemName: string; totalStock: number }> = {};
    orders.forEach((order: any) => {
      const key = `${order.itemId}|${order.itemName}`;
      if (!summaryByItemMap[key]) {
        summaryByItemMap[key] = {
          itemId: order.itemId,
          itemName: order.itemName,
          totalStock: 0,
        };
      }
      summaryByItemMap[key].totalStock += order.stockCount || 0;
    });

    const summaryByItemArray = Object.values(summaryByItemMap)
      .sort((a, b) => b.totalStock - a.totalStock);

    // Summary by Client and Item
    const summaryByClientItemMap: Record<string, { client: string; itemId: string; itemName: string; totalStock: number }> = {};
    orders.forEach((order: any) => {
      const key = `${order.clientName}|${order.itemId}|${order.itemName}`;
      if (!summaryByClientItemMap[key]) {
        summaryByClientItemMap[key] = {
          client: order.clientName,
          itemId: order.itemId,
          itemName: order.itemName,
          totalStock: 0,
        };
      }
      summaryByClientItemMap[key].totalStock += order.stockCount || 0;
    });

    const summaryByClientItemArray = Object.values(summaryByClientItemMap)
      .sort((a, b) => b.totalStock - a.totalStock);

    return NextResponse.json({
      summaryByItem: summaryByItemArray,
      summaryByClientItem: summaryByClientItemArray,
      totalOrders: orders.length,
    });
  } catch (error: any) {
    console.error("Error fetching summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

