import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Order, { IOrderItem } from "@/models/Order";
import Billing from "@/models/Billing";
import Inventory from "@/models/Inventory";
import { authenticateRequest } from "@/lib/middleware/auth";
import { getCurrentDate, getCurrentTime } from "@/lib/utils/dateTime";
import { generateBillId } from "@/lib/utils/billIdGenerator";
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
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemId || item.billedStockCount === undefined || item.price === undefined) {
        return NextResponse.json(
          { error: "Each item must have itemId, billedStockCount, and price" },
          { status: 400 }
        );
      }
      if (item.billedStockCount <= 0 || item.price < 0) {
        return NextResponse.json(
          { error: "billedStockCount must be greater than 0 and price must be non-negative" },
          { status: 400 }
        );
      }
    }

    const order = await Order.findOne({ _id: id, archived: false });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate a single billId for this billing transaction
    let billId = await generateBillId();
    
    if (!billId || !billId.match(/^BILL\d{6}$/)) {
      console.error("Invalid billId generated:", billId);
      return NextResponse.json(
        { error: "Failed to generate valid bill ID" },
        { status: 500 }
      );
    }
    
    // Check if billId already exists (retry if needed)
    let existingBill = await Billing.findOne({ billId });
    let attempts = 0;
    while (existingBill && attempts < 10) {
      billId = await generateBillId();
      if (!billId || !billId.match(/^BILL\d{6}$/)) {
        console.error("Invalid billId generated on retry:", billId);
        return NextResponse.json(
          { error: "Failed to generate valid bill ID" },
          { status: 500 }
        );
      }
      existingBill = await Billing.findOne({ billId });
      attempts++;
    }
    
    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique bill ID after multiple attempts" },
        { status: 500 }
      );
    }
    
    console.log("Generated billId for billing transaction:", billId);

    const billingEntries = [];
    const errors: string[] = [];

    // Process each item
    for (const billingItem of items) {
      const { itemId, billedStockCount, price } = billingItem;

      // Find the item in the order
      const orderItem = order.items.find((item: IOrderItem) => item.itemId === itemId);
      if (!orderItem) {
        errors.push(`Item ${itemId} not found in order`);
        continue;
      }

      // Check if there's enough stock (exclude archived)
      const inventory = await Inventory.findOne({ itemId, archived: false });
      if (!inventory || inventory.stockCount < billedStockCount) {
        errors.push(`Insufficient stock for item ${itemId}`);
        continue;
      }

      // Check if billing exceeds ordered quantity
      const newBilledCount = (orderItem.billedStockCount || 0) + billedStockCount;
      if (newBilledCount > orderItem.stockCount) {
        errors.push(`Billed quantity for item ${itemId} cannot exceed ordered quantity`);
        continue;
      }

      // Update order item billed count
      orderItem.billedStockCount = newBilledCount;

      // Reduce inventory
      inventory.stockCount -= billedStockCount;
      await inventory.save();

      // Create billing entry
      const totalAmount = billedStockCount * price;
      const billing = new Billing({
        billId,
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

      // Validate before saving
      const validationError = billing.validateSync();
      if (validationError) {
        console.error("Billing validation error:", validationError);
        errors.push(`Validation error for item ${itemId}: ${validationError.message}`);
        continue;
      }

      await billing.save();
      
      // Verify billId was saved
      if (!billing.billId) {
        console.error("billId not saved for billing entry:", billing._id);
        errors.push(`Failed to save billId for item ${itemId}`);
        continue;
      }
      
      console.log("Saved billing entry with billId:", billing.billId, "for item:", itemId);
      billingEntries.push({
        id: billing._id.toString(),
        billId: billing.billId,
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
      });
    }

    if (errors.length > 0 && billingEntries.length === 0) {
      return NextResponse.json(
        { error: errors.join("; ") },
        { status: 400 }
      );
    }

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
      billings: billingEntries,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bill order error:", error);
    return NextResponse.json(
      { error: "Failed to bill order" },
      { status: 500 }
    );
  }
}
