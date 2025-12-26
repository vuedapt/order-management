import { StockExportData } from "./stockTypes";

export async function exportStockToPDF(data: StockExportData): Promise<void> {
  const { stocks, totalItems, totalStockCount } = data;
  
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

function generatePDF(data: StockExportData): void {
  const { stocks, totalItems, totalStockCount } = data;
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
  doc.text("Stock Summary Report", margin, yPosition);
  yPosition += 10;
  
  // Summary info
  doc.setFontSize(12);
  doc.text(`Total Items: ${totalItems}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Total Stock Count: ${totalStockCount}`, margin, yPosition);
  yPosition += lineHeight;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;
  
  // Table header
  doc.setFontSize(14);
  doc.text("Stock by Item", margin, yPosition);
  yPosition += lineHeight;
  
  // Table
  doc.setFontSize(10);
  const tableStartY = yPosition;
  
  // Headers
  doc.setFont(undefined, "bold");
  doc.text("Item ID", margin, yPosition);
  doc.text("Item Name", margin + 40, yPosition);
  doc.text("Stock Count", margin + 100, yPosition);
  yPosition += tableRowHeight;
  
  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
  
  // Table rows
  doc.setFont(undefined, "normal");
  stocks.forEach((stock) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(stock.itemId, margin, yPosition);
    doc.text(stock.itemName.length > 30 ? stock.itemName.substring(0, 30) + "..." : stock.itemName, margin + 40, yPosition);
    doc.text(stock.stockCount.toString(), margin + 100, yPosition);
    yPosition += tableRowHeight;
  });
  
  // Save PDF
  doc.save("stock-summary.pdf");
}

