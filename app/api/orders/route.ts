import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
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
    const timeRange = searchParams.get("timeRange") || "all";
    const status = searchParams.get("status") || "";

    // Build query - exclude archived data
    const query: any = { archived: false };

    // Status filter
    if (status) {
      query.status = status;
    }

    // Time range filter
    if (timeRange !== "all") {
      const { start, end } = getDateRangeFilter(timeRange);
      query.createdAt = { $gte: start, $lte: end };
    }

    // Client name filter
    if (clientName) {
      query.clientName = { $regex: clientName, $options: "i" };
    }

    // Item filters (check in items array)
    if (itemId || itemName) {
      query.$or = [];
      if (itemId) {
        query.$or.push({ "items.itemId": { $regex: itemId, $options: "i" } });
      }
      if (itemName) {
        query.$or.push({ "items.itemName": { $regex: itemName, $options: "i" } });
      }
    }

    // Get total count
    const total = await Order.countDocuments(query);

    // Get paginated results
    const skip = (page - 1) * pageSize;
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Transform to match frontend format and filter items if item filters are applied
    const transformedOrders = orders
      .map((order: any) => {
        let filteredItems = order.items;
        
        // Filter items within the order if itemId or itemName filters are applied
        // Use OR logic to match the MongoDB query behavior
        if (itemId || itemName) {
          filteredItems = order.items.filter((item: any) => {
            const matchesItemId = itemId ? new RegExp(itemId, "i").test(item.itemId) : false;
            const matchesItemName = itemName ? new RegExp(itemName, "i").test(item.itemName) : false;
            // If both filters are provided, match if either condition is true (OR)
            // If only one filter is provided, match that condition
            if (itemId && itemName) {
              return matchesItemId || matchesItemName;
            } else if (itemId) {
              return matchesItemId;
            } else {
              return matchesItemName;
            }
          });
        }
        
        return {
          id: order._id.toString(),
          orderId: order.orderId,
          clientName: order.clientName,
          items: filteredItems,
          date: order.date,
          time: order.time,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      })
      .filter((order: any) => order.items.length > 0); // Exclude orders with no matching items

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      orders: transformedOrders,
      total,
      totalPages,
    });
  } catch (error: any) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
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
    const { clientName, items } = body;

    if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Client name and at least one item are required" },
        { status: 400 }
      );
    }

    // Generate order ID
    const { generateOrderId } = await import("@/lib/utils/orderIdGenerator");
    const { getCurrentDate, getCurrentTime } = await import("@/lib/utils/dateTime");

    // Generate order ID (handles sequential generation internally)
    let orderId = await generateOrderId();
    
    // Check if order ID already exists (retry if needed)
    let existingOrder = await Order.findOne({ orderId });
    let attempts = 0;
    while (existingOrder && attempts < 10) {
      orderId = await generateOrderId();
      existingOrder = await Order.findOne({ orderId });
      attempts++;
    }

    // Validate items
    const orderItems = items.map((item: any) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      stockCount: parseInt(item.stockCount) || 0,
      billedStockCount: 0,
    }));

    // Determine status based on items
    const totalStock = orderItems.reduce((sum: number, item: any) => sum + item.stockCount, 0);
    const status = totalStock > 0 ? "uncompleted" : "uncompleted";

    const order = new Order({
      orderId,
      clientName,
      items: orderItems,
      date: getCurrentDate(),
      time: getCurrentTime(),
      status,
    });

    await order.save();

    const transformedOrder = {
      id: order._id.toString(),
      orderId: order.orderId,
      clientName: order.clientName,
      items: order.items,
      date: order.date,
      time: order.time,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json(transformedOrder, { status: 201 });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
