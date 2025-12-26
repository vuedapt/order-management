import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import Stock from "@/models/Stock";
import { verifyToken } from "@/lib/auth/jwt";
import { formatDateIST, formatTimeIST } from "@/lib/utils/dateTime";
import { generateNextOrderId } from "@/lib/utils/orderIdGenerator";

// Middleware to verify authentication
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

// GET - Fetch orders with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");
    const itemId = searchParams.get("itemId") || "";
    const itemName = searchParams.get("itemName") || "";
    const clientName = searchParams.get("clientName") || "";
    const timeRange = searchParams.get("timeRange") || "all";

    // Build query
    const query: any = {};

    // Time range filter
    if (timeRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7d":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "1m":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "1y":
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }
      query.createdAt = { $gte: startDate };
    }

    // Text filters (client-side filtering for better performance)
    const allOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    let filteredOrders = allOrders;

    if (itemId.trim()) {
      const searchTerm = itemId.trim().toLowerCase();
      filteredOrders = filteredOrders.filter((order) =>
        order.itemId.toLowerCase().includes(searchTerm)
      );
    }

    if (itemName.trim()) {
      const searchTerm = itemName.trim().toLowerCase();
      filteredOrders = filteredOrders.filter((order) =>
        order.itemName.toLowerCase().includes(searchTerm)
      );
    }

    if (clientName.trim()) {
      const searchTerm = clientName.trim().toLowerCase();
      filteredOrders = filteredOrders.filter((order) =>
        order.clientName.toLowerCase().includes(searchTerm)
      );
    }

    const total = filteredOrders.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    console.log("[API GET] Mapping orders for response", {
      totalOrders: paginatedOrders.length,
      sampleOrder: paginatedOrders[0] ? {
        _id: paginatedOrders[0]._id?.toString(),
        orderId: paginatedOrders[0].orderId,
        hasOrderId: !!paginatedOrders[0].orderId,
        orderKeys: Object.keys(paginatedOrders[0]),
      } : null,
    });

    return NextResponse.json({
      orders: paginatedOrders.map((order: any) => {
        const mappedOrder = {
          id: order._id.toString(),
          orderId: order.orderId || `TEMP-${order._id.toString().slice(-6).toUpperCase()}`,
          itemId: order.itemId,
          itemName: order.itemName,
          clientName: order.clientName,
          stockCount: order.stockCount,
          date: order.date || formatDateIST(order.createdAt),
          time: order.time || formatTimeIST(order.createdAt),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
        
        if (!order.orderId) {
          console.warn("[API GET] Order missing orderId", {
            id: order._id.toString(),
            orderId: order.orderId,
            fullOrder: order,
          });
        }
        
        return mappedOrder;
      }),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { itemId, itemName, clientName, stockCount } = body;

    if (!itemId || !itemName || !clientName || stockCount === undefined) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Auto-generate date and time from current IST
    const currentDate = formatDateIST(new Date());
    const currentTime = formatTimeIST(new Date());

    console.log("[API POST] Step 1: Starting order creation", { itemId, itemName, clientName, stockCount });

    // Get the last order to generate the next order ID
    // Exclude TEMP orderIds and only get valid format (AAA001-ZZZ999)
    console.log("[API POST] Step 2: Querying for last order with valid orderId");
    const lastOrder = await Order.findOne({ 
      orderId: { 
        $exists: true, 
        $ne: null,
        $regex: /^[A-Z]{3}\d{3}$/, // Only valid format AAA001-ZZZ999
        $not: /^TEMP-/, // Exclude TEMP orderIds
      } 
    })
      .sort({ orderId: -1 })
      .lean();
    
    console.log("[API POST] Step 3: Last order query result", { 
      found: !!lastOrder,
      lastOrderId: lastOrder?.orderId,
      lastOrderIdType: typeof lastOrder?.orderId,
      lastOrderFull: lastOrder 
    });

    const lastOrderId = lastOrder?.orderId || null;
    console.log("[API POST] Step 4: Generating next orderId", { lastOrderId });
    
    const nextOrderId = generateNextOrderId(lastOrderId);
    console.log("[API POST] Step 5: Generated orderId", { nextOrderId });

    console.log("[API POST] Step 6: Creating Order instance", {
      orderId: nextOrderId,
      itemId,
      itemName,
      clientName,
      stockCount: parseInt(stockCount),
      date: currentDate,
      time: currentTime,
    });

    const order = new Order({
      orderId: nextOrderId,
      itemId,
      itemName,
      clientName,
      stockCount: parseInt(stockCount),
      date: currentDate,
      time: currentTime,
    });

    console.log("[API POST] Step 7: Order instance created", {
      _id: order._id?.toString(),
      orderId: order.orderId,
      hasOrderId: !!order.orderId,
      orderIdType: typeof order.orderId,
    });

    try {
      console.log("[API POST] Step 8: Decreasing stock");
      // Decrease stock for the item
      const stock = await Stock.findOne({ itemId });
      if (!stock) {
        return NextResponse.json(
          { error: `Item ${itemId} not found in stock` },
          { status: 404 }
        );
      }
      if (stock.stockCount < parseInt(stockCount)) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${stock.stockCount}, Requested: ${parseInt(stockCount)}` },
          { status: 400 }
        );
      }
      stock.stockCount -= parseInt(stockCount);
      await stock.save();
      console.log("[API POST] Step 8.1: Stock decreased successfully", {
        itemId,
        newStockCount: stock.stockCount,
      });

      console.log("[API POST] Step 9: Saving order to database");
      await order.save();
      console.log("[API POST] Step 10: Order saved successfully", { 
        id: order._id.toString(), 
        orderId: order.orderId,
        orderIdAfterSave: order.orderId,
        orderKeys: Object.keys(order.toObject ? order.toObject() : {}),
      });
    } catch (saveError: any) {
      console.error("[API POST] Step 9 ERROR: Error saving order", {
        error: saveError.message,
        errorStack: saveError.stack,
        errorName: saveError.name,
        errorCode: saveError.code,
        errorKeyPattern: saveError.keyPattern,
        errorKeyValue: saveError.keyValue,
      });
      throw saveError;
    }

    // Verify the order was saved with orderId
    console.log("[API POST] Step 11: Verifying saved order from DB");
    const savedOrder = await Order.findById(order._id).lean();
    console.log("[API POST] Step 12: Verified saved order from DB", { 
      id: savedOrder?._id?.toString(), 
      orderId: savedOrder?.orderId,
      hasOrderId: !!savedOrder?.orderId,
      savedOrderKeys: savedOrder ? Object.keys(savedOrder) : [],
      fullSavedOrder: savedOrder,
    });

    const finalOrderId = savedOrder?.orderId || order.orderId || nextOrderId;
    console.log("[API POST] Step 13: Preparing response", {
      finalOrderId,
      sources: {
        fromDB: savedOrder?.orderId,
        fromInstance: order.orderId,
        generated: nextOrderId,
      },
    });

    const response = {
      id: order._id.toString(),
      orderId: finalOrderId,
      itemId: order.itemId,
      itemName: order.itemName,
      clientName: order.clientName,
      stockCount: order.stockCount,
      date: order.date,
      time: order.time,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    console.log("[API POST] Step 14: Final response", response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

