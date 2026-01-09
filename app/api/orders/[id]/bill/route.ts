import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order, { IOrderItem } from "@/models/Order";
import Billing from "@/models/Billing";
import Inventory from "@/models/Inventory";
import { authenticateRequest } from "@/lib/middleware/auth";
import { getCurrentDate, getCurrentTime } from "@/lib/utils/dateTime";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { itemId, billedStockCount, price } = body;

    if (!itemId || billedStockCount === undefined || price === undefined) {
      return NextResponse.json(
        { error: "itemId, billedStockCount, and price are required" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ _id: id, archived: false });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the item in the order
    const orderItem = order.items.find((item: IOrderItem) => item.itemId === itemId);
    if (!orderItem) {
      return NextResponse.json(
        { error: "Item not found in order" },
        { status: 404 }
      );
    }

    // Check if there's enough stock (exclude archived)
    const inventory = await Inventory.findOne({ itemId, archived: false });
    if (!inventory || inventory.stockCount < billedStockCount) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // Check if billing exceeds ordered quantity
    const newBilledCount = (orderItem.billedStockCount || 0) + billedStockCount;
    if (newBilledCount > orderItem.stockCount) {
      return NextResponse.json(
        { error: "Billed quantity cannot exceed ordered quantity" },
        { status: 400 }
      );
    }

    // Update order item billed count
    orderItem.billedStockCount = newBilledCount;

    // Update order status
    const allItemsCompleted = order.items.every(
      (item: IOrderItem) => item.billedStockCount >= item.stockCount
    );
    const someItemsCompleted = order.items.some(
      (item: IOrderItem) => item.billedStockCount > 0
    );

    if (allItemsCompleted) {
      order.status = "completed";
    } else if (someItemsCompleted) {
      order.status = "partially_completed";
    }

    await order.save();

    // Reduce inventory
    inventory.stockCount -= billedStockCount;
    await inventory.save();

    // Create billing entry
    const totalAmount = billedStockCount * price;
    const billing = new Billing({
      orderId: order._id,
      orderOrderId: order.orderId,
      itemId,
      itemName: orderItem.itemName,
      clientName: order.clientName,
      billedStockCount,
      price,
      totalAmount,
      date: getCurrentDate(),
      time: getCurrentTime(),
    });

    await billing.save();

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

    return NextResponse.json({
      order: transformedOrder,
      billing: {
        id: billing._id.toString(),
        orderId: billing.orderId.toString(),
        orderOrderId: billing.orderOrderId,
        itemId: billing.itemId,
        itemName: billing.itemName,
        clientName: billing.clientName,
        billedStockCount: billing.billedStockCount,
        price: billing.price,
        totalAmount: billing.totalAmount,
        date: billing.date,
        time: billing.time,
      },
    });
  } catch (error: any) {
    console.error("Bill order error:", error);
    return NextResponse.json(
      { error: "Failed to bill order" },
      { status: 500 }
    );
  }
}
