import { BillingBill } from "@/types/billing";

export async function exportBillToPDF(bill: BillingBill): Promise<void> {
  // Load jsPDF from CDN
  return new Promise((resolve, reject) => {
    // Check if jsPDF is already loaded
    if ((window as any).jspdf) {
      generatePDF(bill);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    
    script.onload = async () => {
      try {
        await generatePDF(bill);
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

async function generatePDF(bill: BillingBill): Promise<void> {
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
  doc.text("BILL", margin, yPosition);
  yPosition += 10;

  // Bill Details
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(`Bill ID: ${bill.billId}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Order ID: ${bill.orderOrderId}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Client: ${bill.clientName}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Date: ${bill.date}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Time: ${bill.time}`, margin, yPosition);
  yPosition += 10;

  // Items Table Header
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Items", margin, yPosition);
  yPosition += 8;

  // Table - Define column positions for better alignment with proper spacing
  doc.setFontSize(10);
  const colItemId = margin;
  const colItemName = margin + 35;
  const colQty = margin + 100;
  const colPrice = margin + 125;
  const colAmount = pageWidth - margin - 25;
  
  // Headers
  doc.setFont(undefined, "bold");
  doc.text("Item ID", colItemId, yPosition);
  doc.text("Item Name", colItemName, yPosition);
  doc.text("Qty", colQty, yPosition, { align: "right" });
  doc.text("Price (LKR)", colPrice, yPosition, { align: "right" });
  doc.text("Amount", colAmount, yPosition, { align: "right" });
  yPosition += tableRowHeight;

  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
  yPosition += 3;

  // Table rows
  doc.setFont(undefined, "normal");
  for (const item of bill.items) {
    // Check if we need a new page (leave space for footer)
    if (yPosition > pageHeight - footerHeight) {
      // Add footer before new page
      await addFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      yPosition = 20;
      // Redraw headers on new page
      doc.setFont(undefined, "bold");
      doc.text("Item ID", colItemId, yPosition);
      doc.text("Item Name", colItemName, yPosition);
      doc.text("Qty", colQty, yPosition, { align: "right" });
      doc.text("Price (LKR)", colPrice, yPosition, { align: "right" });
      doc.text("Amount", colAmount, yPosition, { align: "right" });
      yPosition += tableRowHeight;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
      yPosition += 3;
      doc.setFont(undefined, "normal");
    }
    
    doc.text(item.itemId, colItemId, yPosition);
    const itemName = item.itemName.length > 20 ? item.itemName.substring(0, 20) + "..." : item.itemName;
    doc.text(itemName, colItemName, yPosition);
    doc.text(item.billedStockCount.toString(), colQty, yPosition, { align: "right" });
    doc.text(item.price.toFixed(2), colPrice, yPosition, { align: "right" });
    doc.text(item.totalAmount.toFixed(2), colAmount, yPosition, { align: "right" });
    yPosition += tableRowHeight;
  }

  yPosition += 5;
  
  // Total Amount
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
  // Move "Total Amount:" label to the left
  doc.text("Total Amount:", colPrice, yPosition, { align: "right" });
  // Amount value aligned to the right (without LKR prefix)
  doc.text(bill.totalAmount.toFixed(2), colAmount, yPosition, { align: "right" });

  // Add footer
  await addFooter(doc, pageWidth, pageHeight, margin);

  // Save PDF
  const fileName = `bill-${bill.billId}-${bill.date}.pdf`;
  doc.save(fileName);
}

async function addFooter(doc: any, pageWidth: number, pageHeight: number, margin: number): Promise<void> {
  const footerY = pageHeight - 20;
  
  // Draw line above footer
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  
  // Add "Powered by" text and logo
  doc.setFontSize(10); // Increased from 8
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
          const logoWidth = 16; // Width in mm (increased from 16)
          const logoHeight = logoWidth / aspectRatio; // Maintain aspect ratio
          
          // Calculate total width (text + spacing + logo) and center
          const spacing = 1; // Decreased from 5 - reduced gap between text and logo
          const totalWidth = textWidth + spacing + logoWidth;
          const startX = (pageWidth - totalWidth) / 2;
          
          // Keep text and logo on the same line
          const logoX = startX + textWidth + spacing;
          const logoY = footerY - logoHeight / 2 - 1; // Move logo 2mm higher
          
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
