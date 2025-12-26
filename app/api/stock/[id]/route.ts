import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/connect";
import Stock from "@/models/Stock";
import { verifyToken } from "@/lib/auth/jwt";

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

// PUT - Update stock item
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
    const { itemId, itemName, stockCount } = body;

    const stock = await Stock.findByIdAndUpdate(
      id,
      {
        itemId,
        itemName,
        stockCount: parseInt(stockCount),
      },
      { new: true, runValidators: true }
    );

    if (!stock) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: stock._id.toString(),
      itemId: stock.itemId,
      itemName: stock.itemName,
      stockCount: stock.stockCount,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    });
  } catch (error: any) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete stock item
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

    const stock = await Stock.findByIdAndDelete(id);

    if (!stock) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Stock item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting stock:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

