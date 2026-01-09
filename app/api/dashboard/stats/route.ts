import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import Billing from "@/models/Billing";
import Inventory from "@/models/Inventory";
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
    const timeRange = searchParams.get("timeRange") || "all";

    // Build base query - exclude archived data
    const baseQuery: any = { archived: false };

    // Apply time range filter
    if (timeRange !== "all") {
      const { start, end } = getDateRangeFilter(timeRange);
      baseQuery.createdAt = { $gte: start, $lte: end };
    }

    // Get orders data
    const orders = await Order.find(baseQuery).lean();
    
    // Get billing data
    const billingQuery = { ...baseQuery };
    if (timeRange !== "all") {
      const { start, end } = getDateRangeFilter(timeRange);
      billingQuery.createdAt = { $gte: start, $lte: end };
    }
    const billings = await Billing.find(billingQuery).lean();

    // Get inventory data
    const inventory = await Inventory.find({ archived: false }).lean();

    // Calculate statistics
    const stats = {
      // Basic counts
      totalOrders: orders.length,
      totalBillings: billings.length,
      totalInventoryItems: inventory.length,
      totalStockCount: inventory.reduce((sum, item) => sum + (item.stockCount || 0), 0),
      totalRevenue: billings.reduce((sum, item) => sum + (item.totalAmount || 0), 0),

      // Order status distribution
      orderStatusDistribution: {
        completed: orders.filter((o: any) => o.status === "completed").length,
        partially_completed: orders.filter((o: any) => o.status === "partially_completed").length,
        uncompleted: orders.filter((o: any) => o.status === "uncompleted").length,
      },

      // Orders over time (daily)
      ordersOverTime: getDailyData(orders, "createdAt"),

      // Revenue over time (daily)
      revenueOverTime: getDailyRevenueData(billings),

      // Top items by quantity ordered
      topItemsByQuantity: getTopItemsByQuantity(orders),

      // Top items by revenue
      topItemsByRevenue: getTopItemsByRevenue(billings),

      // Top clients by orders
      topClientsByOrders: getTopClientsByOrders(orders),

      // Top clients by revenue
      topClientsByRevenue: getTopClientsByRevenue(billings),

      // Billing trends (daily)
      billingTrends: getDailyBillingData(billings),
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}

function getDailyData(data: any[], dateField: string) {
  const dailyMap = new Map<string, number>();
  
  data.forEach((item: any) => {
    const date = new Date(item[dateField]);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
    
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
  });

  return Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getDailyRevenueData(billings: any[]) {
  const dailyMap = new Map<string, number>();
  
  billings.forEach((billing: any) => {
    const date = new Date(billing.createdAt);
    const dateKey = date.toISOString().split("T")[0];
    
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + (billing.totalAmount || 0));
  });

  return Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getDailyBillingData(billings: any[]) {
  const dailyMap = new Map<string, { count: number; revenue: number }>();
  
  billings.forEach((billing: any) => {
    const date = new Date(billing.createdAt);
    const dateKey = date.toISOString().split("T")[0];
    
    const existing = dailyMap.get(dateKey) || { count: 0, revenue: 0 };
    dailyMap.set(dateKey, {
      count: existing.count + 1,
      revenue: existing.revenue + (billing.totalAmount || 0),
    });
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, count: data.count, revenue: Number(data.revenue.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getTopItemsByQuantity(orders: any[], limit: number = 10) {
  const itemMap = new Map<string, { itemId: string; itemName: string; quantity: number }>();
  
  orders.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const key = item.itemId;
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += item.stockCount || 0;
      } else {
        itemMap.set(key, {
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.stockCount || 0,
        });
      }
    });
  });

  return Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

function getTopItemsByRevenue(billings: any[], limit: number = 10) {
  const itemMap = new Map<string, { itemId: string; itemName: string; revenue: number }>();
  
  billings.forEach((billing: any) => {
    const key = billing.itemId;
    const existing = itemMap.get(key);
    if (existing) {
      existing.revenue += billing.totalAmount || 0;
    } else {
      itemMap.set(key, {
        itemId: billing.itemId,
        itemName: billing.itemName,
        revenue: billing.totalAmount || 0,
      });
    }
  });

  return Array.from(itemMap.values())
    .map((item) => ({ ...item, revenue: Number(item.revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

function getTopClientsByOrders(orders: any[], limit: number = 10) {
  const clientMap = new Map<string, number>();
  
  orders.forEach((order: any) => {
    const client = order.clientName;
    clientMap.set(client, (clientMap.get(client) || 0) + 1);
  });

  return Array.from(clientMap.entries())
    .map(([client, count]) => ({ client, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopClientsByRevenue(billings: any[], limit: number = 10) {
  const clientMap = new Map<string, number>();
  
  billings.forEach((billing: any) => {
    const client = billing.clientName;
    clientMap.set(client, (clientMap.get(client) || 0) + (billing.totalAmount || 0));
  });

  return Array.from(clientMap.entries())
    .map(([client, revenue]) => ({ client, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

