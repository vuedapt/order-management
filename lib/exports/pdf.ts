import { ExportData } from "./types";

export async function exportToPDF(data: ExportData): Promise<void> {
  const { summaryByItem, summaryByClientItem, totalOrders } = data;
  
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
    
    script.onload = () => {
      try {
        generatePDF(data);
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

function generatePDF(data: ExportData): void {
  const { summaryByItem, summaryByClientItem, totalOrders } = data;
  const { jsPDF } = (window as any).jspdf;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const lineHeight = 7;
  const tableRowHeight = 8;
  
  // Title
  doc.setFontSize(18);
  doc.text("Order Summary Report", margin, yPosition);
  yPosition += 10;
  
  // Meta information
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Total Orders: ${totalOrders}`, margin, yPosition);
  yPosition += 15;
  
  // Summary by Item
  doc.setFontSize(14);
  doc.text("Summary by Item", margin, yPosition);
  yPosition += 10;
  
  // Table header
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Item ID", margin, yPosition);
  doc.text("Item Name", margin + 50, yPosition);
  doc.text("Total Stock", pageWidth - margin - 40, yPosition, { align: "right" });
  yPosition += lineHeight;
  
  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  // Table rows
  doc.setFont(undefined, "normal");
  summaryByItem.forEach((row) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(row.itemId, margin, yPosition);
    doc.text(row.itemName, margin + 50, yPosition);
    doc.text(row.totalStock.toString(), pageWidth - margin - 40, yPosition, { align: "right" });
    yPosition += tableRowHeight;
  });
  
  yPosition += 10;
  
  // Summary by Client and Item
  // Check if we need a new page
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Summary by Client and Item", margin, yPosition);
  yPosition += 10;
  
  // Table header
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Client", margin, yPosition);
  doc.text("Item ID", margin + 50, yPosition);
  doc.text("Item Name", margin + 90, yPosition);
  doc.text("Total Stock", pageWidth - margin - 40, yPosition, { align: "right" });
  yPosition += lineHeight;
  
  // Draw line under header
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  // Table rows
  doc.setFont(undefined, "normal");
  summaryByClientItem.forEach((row) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(row.client, margin, yPosition);
    doc.text(row.itemId, margin + 50, yPosition);
    doc.text(row.itemName, margin + 90, yPosition);
    doc.text(row.totalStock.toString(), pageWidth - margin - 40, yPosition, { align: "right" });
    yPosition += tableRowHeight;
  });
  
  // Save the PDF using download
  const fileName = `order-summary-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

