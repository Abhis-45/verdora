import jsPDF from "jspdf";
import { Order, OrderItem } from "@/types/user";

interface InvoiceServiceItem {
  packageName?: string;
  price?: number;
  quantity?: number;
}

export const generateInvoicePDF = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Helper function to add text
  const addText = (
    text: string,
    x: number,
    y: number,
    options?: Parameters<typeof doc.text>[3]
  ) => {
    doc.text(text, x, y, options);
  };

  // Helper function to move to next line
  const nextLine = (increment: number = 7) => {
    yPosition += increment;
  };

  // Header - Logo/Company Name
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94); // Green color
  addText("VERDORA", 15, yPosition);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  addText("Premium Plants & Decor", 15, yPosition + 6);
  nextLine(15);

  // Invoice Title and Details
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  addText("INVOICE", pageWidth - 40, yPosition);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  addText(`Invoice #: ${order._id.slice(-8).toUpperCase()}`, pageWidth - 90, yPosition + 8);
  addText(`Date: ${new Date(order.date).toLocaleDateString()}`, pageWidth - 90, yPosition + 14);
  addText(`Status: ${order.status.toUpperCase()}`, pageWidth - 90, yPosition + 20);
  nextLine(25);

  // Customer Information Section
  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94);
  addText("BILL TO:", 15, yPosition);
  nextLine(6);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  addText(order.name || "Guest", 15, yPosition);
  addText(`Email: ${order.email || "N/A"}`, 15, yPosition + 6);
  addText(`Phone: ${order.mobile || "N/A"}`, 15, yPosition + 12);

  if (order.address) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    addText(
      `${order.address.address || ""}`,
      15,
      yPosition + 18
    );
    addText(
      `${order.address.city || ""}, ${order.address.state || ""} ${
        order.address.pincode || ""
      }`,
      15,
      yPosition + 23
    );
  }

  yPosition += 35;

  // Items Table Header
  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94);
  doc.setFillColor(240, 253, 250); // Light green background
  doc.rect(15, yPosition - 4, pageWidth - 30, 7, "F");
  
  addText("ITEM DESCRIPTION", 17, yPosition);
  addText("QTY", pageWidth - 65, yPosition);
  addText("PRICE", pageWidth - 45, yPosition);
  addText("TOTAL", pageWidth - 25, yPosition);

  nextLine(8);

  // Items List
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  if (order.items && order.items.length > 0) {
    order.items.forEach((item: OrderItem) => {
      const itemName = item.productName || "Product";
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const total = price * quantity;

      addText(itemName, 17, yPosition);
      addText(quantity.toString(), pageWidth - 65, yPosition);
      addText(`₹${price.toFixed(2)}`, pageWidth - 45, yPosition);
      addText(`₹${total.toFixed(2)}`, pageWidth - 25, yPosition);
      nextLine(6);
    });
  }

  // Services if any
  if (order.services && order.services.length > 0) {
    order.services.forEach((service: InvoiceServiceItem) => {
      const serviceName = service.packageName || "Service";
      const price = service.price || 0;
      const quantity = service.quantity || 1;
      const total = price * quantity;

      addText(`${serviceName} (Service)`, 17, yPosition);
      addText(quantity.toString(), pageWidth - 65, yPosition);
      addText(`₹${price.toFixed(2)}`, pageWidth - 45, yPosition);
      addText(`₹${total.toFixed(2)}`, pageWidth - 25, yPosition);
      nextLine(6);
    });
  }

  nextLine(5);

  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  nextLine(8);

  // Totals Section
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Subtotal
  addText("Subtotal:", pageWidth - 65, yPosition);
  const subtotal = (order.total || 0) + (order.discount || 0);
  addText(`₹${subtotal.toFixed(2)}`, pageWidth - 25, yPosition);
  nextLine(6);

  // Discount
  if (order.discount && order.discount > 0) {
    addText("Discount:", pageWidth - 65, yPosition);
    addText(`-₹${order.discount.toFixed(2)}`, pageWidth - 25, yPosition);
    nextLine(6);
  }

  // Total
  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94);
  doc.setFont("helvetica", "bold");
  addText("TOTAL:", pageWidth - 65, yPosition);
  addText(`₹${(order.total || 0).toFixed(2)}`, pageWidth - 25, yPosition);

  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  addText("Thank you for your order!", 15, yPosition);
  addText(
    "For inquiries, contact: support@verdora.com",
    15,
    yPosition + 5
  );
  addText(
    `Generated on ${new Date().toLocaleString()}`,
    15,
    yPosition + 10
  );

  // Download the PDF
  const fileName = `Verdora-Invoice-${order._id.slice(-8).toUpperCase()}.pdf`;
  doc.save(fileName);
};
