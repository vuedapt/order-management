import { BillingBill } from "@/types/billing";

export interface BillingSummaryData {
  bills: BillingBill[];
  totalAmount: number;
  filters?: {
    itemId?: string;
    itemName?: string;
    clientName?: string;
    orderOrderId?: string;
    timeRange?: string;
  };
}

export async function exportBillingSummaryToPDF(data: BillingSummaryData): Promise<void> {
  // Load jsPDF from CDN
  return new Promise((resolve, reject) => {
    // Check if jsPDF is already loaded
    if ((window as any).jspdf) {
      generatePDF(data);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    
    script.onload = async () => {
      try {
        await generatePDF(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    script.onerror = () => {
      reject(new Error("Failed to load jsPDF library"));
    };
    
    document.head.appendChild(script);
  });
}

async function generatePDF(data: BillingSummaryData): Promise<void> {
  const { bills, totalAmount, filters } = data;
  const { jsPDF } = (window as any).jspdf;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const lineHeight = 7;
  const tableRowHeight = 8;
  const footerHeight = 30;

  // Company Name
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Shree Fashion", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("Billing Summary Report", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Summary info
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Total Bills: ${bills.length}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Grand Total: ${totalAmount.toFixed(2)}`, margin, yPosition);
  yPosition += lineHeight;

  // Show active filters if any
  if (filters) {
    const activeFilters: string[] = [];
    if (filters.clientName) activeFilters.push(`Client: ${filters.clientName}`);
    if (filters.itemId) activeFilters.push(`Item ID: ${filters.itemId}`);
    if (filters.itemName) activeFilters.push(`Item Name: ${filters.itemName}`);
    if (filters.orderOrderId) activeFilters.push(`Order ID: ${filters.orderOrderId}`);
    if (filters.timeRange && filters.timeRange !== "all") {
      const timeRangeLabels: Record<string, string> = {
        today: "Today",
        "7d": "Last 7 Days",
        "1m": "Last Month",
        "1y": "Last Year",
      };
      activeFilters.push(`Time Range: ${timeRangeLabels[filters.timeRange] || filters.timeRange}`);
    }
    
    if (activeFilters.length > 0) {
      doc.text(`Filters: ${activeFilters.join(", ")}`, margin, yPosition);
      yPosition += lineHeight;
    }
  }

  yPosition += 10;

  // Bills Table Header
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Bills", margin, yPosition);
  yPosition += 8;

  // Table - Define column positions with proper spacing
  doc.setFontSize(10);
  const colBillId = margin;
  const colOrderId = margin + 32;
  const colClient = margin + 68;
  const colDate = margin + 100;
  const colAmount = pageWidth - margin - 35;

  // Headers
  doc.setFont(undefined, "bold");
  doc.text("Bill ID", colBillId, yPosition);
  doc.text("Order ID", colOrderId, yPosition);
  doc.text("Client", colClient, yPosition);
  doc.text("Date", colDate, yPosition);
  doc.text("Amount", colAmount, yPosition, { align: "right" });
  yPosition += tableRowHeight;

  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
  yPosition += 3;

  // Table rows
  doc.setFont(undefined, "normal");
  for (const bill of bills) {
    // Check if we need a new page (leave space for footer and total)
    if (yPosition > pageHeight - footerHeight - 15) {
      await addFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      yPosition = 20;
      // Redraw headers on new page
      doc.setFont(undefined, "bold");
      doc.text("Bill ID", colBillId, yPosition);
      doc.text("Order ID", colOrderId, yPosition);
      doc.text("Client", colClient, yPosition);
      doc.text("Date", colDate, yPosition);
      doc.text("Amount", colAmount, yPosition, { align: "right" });
      yPosition += tableRowHeight;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
      yPosition += 3;
      doc.setFont(undefined, "normal");
    }

    doc.text(bill.billId, colBillId, yPosition);
    doc.text(bill.orderOrderId, colOrderId, yPosition);
    const clientName = bill.clientName.length > 12 ? bill.clientName.substring(0, 12) + "..." : bill.clientName;
    doc.text(clientName, colClient, yPosition);
    doc.text(bill.date, colDate, yPosition);
    doc.text(bill.totalAmount.toFixed(2), colAmount, yPosition, { align: "right" });
    yPosition += tableRowHeight;
  }

  yPosition += 5;

  // Grand Total
  if (yPosition > pageHeight - footerHeight) {
    await addFooter(doc, pageWidth, pageHeight, margin);
    doc.addPage();
    yPosition = 20;
  }

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  const totalLabelX = colAmount - 20;
  doc.text("Grand Total:", totalLabelX, yPosition, { align: "right" });
  doc.text(totalAmount.toFixed(2), colAmount, yPosition, { align: "right" });

  // Add footer
  await addFooter(doc, pageWidth, pageHeight, margin);

  // Save PDF
  const fileName = `billing-summary-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

async function addFooter(doc: any, pageWidth: number, pageHeight: number, margin: number): Promise<void> {
  const footerY = pageHeight - 20;
  
  // Draw line above footer
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  // Add "Powered by" text and logo
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  const poweredByText = "Powered by";
  const textWidth = doc.getTextWidth(poweredByText);
  
  // Try to add logo with "Powered by" text
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = window.location.origin + "/vuedapt-blue-black.png";
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        try {
          // Get natural image dimensions to maintain aspect ratio
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;
          const aspectRatio = naturalWidth / naturalHeight;
          
          // Set desired logo width and calculate height to maintain aspect ratio
          const logoWidth = 16; // Width in mm
          const logoHeight = logoWidth / aspectRatio; // Maintain aspect ratio
          
          // Calculate total width (text + spacing + logo) and center
          const spacing = 1; // Decreased from 5 - reduced gap between text and logo
          const totalWidth = textWidth + spacing + logoWidth;
          const startX = (pageWidth - totalWidth) / 2;
          
          // Keep text and logo on the same line
          const logoX = startX + textWidth + spacing;
          const logoY = footerY - logoHeight / 2 - 1; // Move logo 1mm higher
          
          // Add "Powered by" text
          doc.text(poweredByText, startX, footerY);
          
          // Add logo next to text (maintaining aspect ratio)
          doc.addImage(img, "PNG", logoX, logoY, logoWidth, logoHeight, undefined, "FAST");
          resolve();
        } catch (e) {
          // If logo fails, just show text
          const startX = (pageWidth - textWidth) / 2;
          doc.text(poweredByText, startX, footerY);
          console.log("Could not add logo to PDF:", e);
          resolve();
        }
      };
      img.onerror = () => {
        // If logo fails to load, just show text
        const startX = (pageWidth - textWidth) / 2;
        doc.text(poweredByText, startX, footerY);
        console.log("Could not load logo for PDF");
        resolve();
      };
      // Timeout after 2 seconds
      setTimeout(() => {
        const startX = (pageWidth - textWidth) / 2;
        doc.text(poweredByText, startX, footerY);
        resolve();
      }, 2000);
    });
  } catch (e) {
    // If logo fails, just show text
    const startX = (pageWidth - textWidth) / 2;
    doc.text(poweredByText, startX, footerY);
    console.log("Could not add logo to PDF:", e);
  }
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
}
