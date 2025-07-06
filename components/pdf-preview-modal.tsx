'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Download, Eye } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useTheme } from '@/lib/use-theme';
import { CartItem } from '@/lib/store/cart';
import { Customer } from '@/lib/store/customers';
import { generateAndPreviewPDF, downloadPDF } from '@/lib/pdf-generator';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  items: CartItem[];
}

export function PDFPreviewModal({ isOpen, onClose, customer, items }: PDFPreviewModalProps) {
  const theme = useTheme();
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate invoice number and data (memoized to prevent continuous updates)
  const invoiceData = useMemo(() => {
    const invoiceNumber = `INV-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString('en-IN');
    const outItems = items.filter(item => item.type === 'out');
    const totalAmount = outItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    
    return {
      customer,
      items: outItems,
      invoiceNumber,
      date: currentDate,
      totalAmount
    };
  }, [customer, items]);

  useEffect(() => {
    if (isOpen && invoiceData.items.length > 0) {
      setIsGenerating(true);
      
      try {
        const dataUri = generateAndPreviewPDF(invoiceData);
        setPdfDataUri(dataUri);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  }, [isOpen, invoiceData]);

  const handleDownload = () => {
    downloadPDF(invoiceData);
  };

  const handleClose = () => {
    setPdfDataUri('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sales Invoice Preview" size="3xl">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.foreground }}>
              Invoice #{invoiceData.invoiceNumber}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
              Customer: {customer.name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !pdfDataUri}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
              }}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: theme.colors.border }}>
          {isGenerating ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p style={{ color: theme.colors.mutedForeground }}>Generating PDF...</p>
              </div>
            </div>
          ) : pdfDataUri ? (
            <iframe
              src={pdfDataUri}
              className="w-full h-[600px]"
              title="PDF Preview"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p style={{ color: theme.colors.mutedForeground }}>Unable to generate PDF preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.muted }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium" style={{ color: theme.colors.foreground }}>Invoice #</p>
              <p style={{ color: theme.colors.mutedForeground }}>{invoiceData.invoiceNumber}</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: theme.colors.foreground }}>Date</p>
              <p style={{ color: theme.colors.mutedForeground }}>{invoiceData.date}</p>
            </div>
            <div>
              <p className="font-medium" style={{ color: theme.colors.foreground }}>Items</p>
              <p style={{ color: theme.colors.mutedForeground }}>
                {invoiceData.items.length} products
              </p>
            </div>
            <div>
              <p className="font-medium" style={{ color: theme.colors.foreground }}>Total Amount</p>
              <p className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                Rs.{invoiceData.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.foreground,
            }}
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating || !pdfDataUri}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Download Invoice
          </button>
        </div>
      </div>
    </Modal>
  );
} 