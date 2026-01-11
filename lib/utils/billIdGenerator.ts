export async function generateBillId(): Promise<string> {
  // Try to get the last billing to generate sequential ID
  try {
    const { default: connectDB } = await import("@/lib/mongodb/connect");
    const { default: Billing } = await import("@/models/Billing");
    await connectDB();
    
    // Find the last billing with a valid BILL###### format, sorted by billId descending
    // This ensures we get the highest number
    const lastBilling = await Billing.findOne({
      billId: { $regex: /^BILL\d{6}$/ }
    })
      .sort({ billId: -1 }) // Sort by billId descending to get highest number
      .select("billId")
      .lean();
    
    if (lastBilling && lastBilling.billId) {
      const match = lastBilling.billId.match(/^BILL(\d{6})$/);
      if (match) {
        const lastNum = parseInt(match[1], 10);
        if (lastNum >= 999999) {
          throw new Error("Bill ID limit reached (999999)");
        }
        const nextNum = (lastNum + 1).toString().padStart(6, "0");
        const newBillId = `BILL${nextNum}`;
        console.log("Generated billId:", newBillId, "from last:", lastBilling.billId);
        return newBillId;
      }
    }
    
    // If no existing bill found, start from BILL000001
    console.log("No existing bills found, starting from BILL000001");
    return "BILL000001";
  } catch (error) {
    console.error("Error generating sequential bill ID, using fallback:", error);
    // Fallback: try to find any bill and increment, or start from 1
    try {
      const { default: connectDB } = await import("@/lib/mongodb/connect");
      const { default: Billing } = await import("@/models/Billing");
      await connectDB();
      
      // Get the highest bill number
      const allBills = await Billing.find({
        billId: { $regex: /^BILL\d{6}$/ }
      })
        .select("billId")
        .lean();
      
      let maxNum = 0;
      for (const bill of allBills) {
        if (bill.billId) {
          const match = bill.billId.match(/^BILL(\d{6})$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      
      if (maxNum >= 999999) {
        throw new Error("Bill ID limit reached");
      }
      
      const nextNum = (maxNum + 1).toString().padStart(6, "0");
      const newBillId = `BILL${nextNum}`;
      console.log("Fallback generated billId:", newBillId, "max was:", maxNum);
      return newBillId;
    } catch (fallbackError) {
      console.error("Fallback bill ID generation failed:", fallbackError);
      // Last resort: start from 1
      console.log("Using last resort: BILL000001");
      return "BILL000001";
    }
  }
}
