import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order from "@/models/Order";
import { verifyToken } from "@/lib/auth/jwt";
import { formatDateIST, formatTimeIST } from "@/lib/utils/dateTime";

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

// PUT - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Handle both sync and async params (Next.js 15+ uses async)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    const body = await request.json();
    const { itemId, itemName, clientName, stockCount } = body;

    // Auto-update date and time to current IST when order is updated
    const currentDate = formatDateIST(new Date());
    const currentTime = formatTimeIST(new Date());

    const order = await Order.findByIdAndUpdate(
      id,
      {
        itemId,
        itemName,
        clientName,
        stockCount: parseInt(stockCount),
        date: currentDate,
        time: currentTime,
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: order._id.toString(),
      orderId: order.orderId,
      itemId: order.itemId,
      itemName: order.itemName,
      clientName: order.clientName,
      stockCount: order.stockCount,
      date: order.date,
      time: order.time,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Handle both sync and async params (Next.js 15+ uses async)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    console.log("[API] Deleting order with ID:", id);

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      console.error("[API] Order not found with ID:", id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("[API] Order deleted successfully:", order._id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

