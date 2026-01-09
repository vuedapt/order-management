export async function generateOrderId(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Try to get the last order to generate sequential ID
  try {
    const { default: connectDB } = await import("@/lib/mongodb/connect");
    const { default: Order } = await import("@/models/Order");
    await connectDB();
    
    const lastOrder = await Order.findOne()
      .sort({ createdAt: -1 })
      .select("orderId")
      .lean();
    
    if (lastOrder && lastOrder.orderId) {
      const match = lastOrder.orderId.match(/^ORD-(\d{4})-(\d{3})$/);
      if (match && match[1] === year.toString()) {
        const lastNum = parseInt(match[2], 10);
        const nextNum = (lastNum + 1).toString().padStart(3, "0");
        return `ORD-${year}-${nextNum}`;
      }
    }
  } catch (error) {
    console.error("Error generating sequential order ID, using random:", error);
  }
  
  // Fallback to random if sequential fails
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${year}-${randomNum}`;
}
