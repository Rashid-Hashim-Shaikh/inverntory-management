import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer } from '@/lib/store/customers';

// Define the item structure locally since cart store was removed
interface InvoiceItem {
  id: string;
  productId: string;
  product: {
    name: string;
    unit: string;
  };
  quantity: number;
  price: number;
  type: 'in' | 'out';
  addedAt: number;
}

// Extend jsPDF type to include lastAutoTable property
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

interface InvoiceData {
  customer: Customer;
  items: InvoiceItem[];
  invoiceNumber: string;
  date: string;
  totalAmount: number;
}

export const generateSalesInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVENTORY MANAGEMENT SYSTEM', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sales Invoice', 20, 35);
  
  // Invoice Details (Left side)
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 50);
  doc.text(`Date: ${data.date}`, 20, 60);
  
  // Customer Details (Right side)
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer.name, 120, 60);
  doc.text(`Mobile: ${formatMobile(data.customer.mobile)}`, 120, 70);
  
  let rightSideY = 80;
  if (data.customer.address) {
    doc.text(`Address: ${data.customer.address}`, 120, rightSideY);
    rightSideY += 10;
  }
  
  // Items Table - starts earlier due to space savings
  const tableStartY = 100;
  
  const tableData = data.items.map((item, index) => [
    index + 1,
    item.product.name,
    item.quantity.toString(),
    item.product.unit,
    `${item.price.toLocaleString('en-IN')}`,
    `${(item.quantity * item.price).toLocaleString('en-IN')}`
  ]);
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['S.No', 'Product Name', 'Qty', 'Unit', 'Rate (in Rs)', 'Amount (in Rs)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      textColor: 50,
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 15, right: 25 },
    tableWidth: 'wrap',
          columnStyles: {
        0: { halign: 'center', cellWidth: 15 },  // S.No - smaller
        1: { halign: 'left', cellWidth: 65 },    // Product Name - adjusted for right padding
        2: { halign: 'center', cellWidth: 18 },  // Qty - slightly smaller
        3: { halign: 'center', cellWidth: 18 },  // Unit - slightly smaller
        4: { halign: 'right', cellWidth: 35, fontSize: 9 },   // Rate - wider
        5: { halign: 'right', cellWidth: 40, fontSize: 9 }    // Amount - wider
      }
  });
  
  // Total Section
  const finalY = doc.lastAutoTable?.finalY || tableStartY + 100;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total Amount(in Rs): ${data.totalAmount.toLocaleString('en-IN')}`, 120, finalY + 20);
  
  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 20, finalY + 50);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 20, finalY + 60);
  
  return doc;
};

export const generateAndPreviewPDF = (data: InvoiceData): string => {
  const doc = generateSalesInvoicePDF(data);
  return doc.output('datauristring');
};

export const downloadPDF = (data: InvoiceData, filename?: string): void => {
  const doc = generateSalesInvoicePDF(data);
  const defaultFilename = `invoice-${data.invoiceNumber}-${data.customer.name.replace(/\s+/g, '-')}.pdf`;
  doc.save(filename || defaultFilename);
};

const formatMobile = (mobile: string): string => {
  if (mobile.length === 10) {
    return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
  }
  return mobile;
}; 