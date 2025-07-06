'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle, X } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { useCartStore } from '@/lib/store/cart';
import { useProductStore } from '@/lib/store/products';
import { useCustomerStore } from '@/lib/store/customers';
import { generateAndPreviewPDF, downloadPDF } from '@/lib/pdf-generator';
import { toast } from 'react-toastify';

export default function InvoicePreviewPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId');
  
  const { items, processCart, setCartOpen } = useCartStore();
  const { updateInventory } = useProductStore();
  const { customers } = useCustomerStore();
  
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ success: boolean; errors: string[] } | null>(null);

  // Find customer
  const customer = customers.find(c => c.id === Number(customerId));
  
  // Generate invoice data
  const invoiceData = useMemo(() => {
    if (!customer) return null;
    
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

  // Generate PDF on page load
  useEffect(() => {
    if (invoiceData && invoiceData.items.length > 0) {
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
  }, [invoiceData]);



  // Redirect if no customer or items
  useEffect(() => {
    if (!customer || !items.length) {
      router.push('/products');
    }
  }, [customer, items, router]);

  const handleDownload = () => {
    if (invoiceData) {
      downloadPDF(invoiceData);
    }
  };

  const handleProceed = async () => {
    setIsProcessing(true);
    setProcessResult(null);

    try {
      const result = processCart(updateInventory);
      setProcessResult(result);
      
      if (result.success) {
        // Close the cart when stock is updated successfully
        setCartOpen(false);
        // Show success toast
        toast.success('Stock Updated Successfully! Invoice processed and inventory has been updated. Redirecting to products page...');
        // Auto-redirect after successful processing and toast display
        setTimeout(() => {
          router.push('/products');
        }, 4000);
      }
    } catch {
      setProcessResult({
        success: false,
        errors: ['An unexpected error occurred while processing the cart.'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Keep the cart open when going back
    setCartOpen(true);
    router.push('/products');
  };

  if (!customer || !invoiceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invoice preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border 
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Products</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: theme.colors.foreground }}>
                  Invoice Preview
                </h1>
                <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                  {invoiceData.invoiceNumber} • {customer.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={isGenerating || !pdfDataUri}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.secondaryForeground,
                }}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              
              <button
                onClick={handleProceed}
                disabled={isProcessing || processResult?.success}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.primaryForeground,
                }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : processResult?.success ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Proceed & Update Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Preview */}
          <div className="lg:col-span-2">
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: theme.colors.border }}>
              {isGenerating ? (
                <div className="flex items-center justify-center h-[700px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p style={{ color: theme.colors.mutedForeground }}>Generating PDF...</p>
                  </div>
                </div>
              ) : pdfDataUri ? (
                <iframe
                  src={pdfDataUri}
                  className="w-full h-[700px]"
                  title="PDF Preview"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="flex items-center justify-center h-[700px]">
                  <div className="text-center">
                    <X className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p style={{ color: theme.colors.mutedForeground }}>Unable to generate PDF preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="p-6 rounded-lg border" style={{ 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border 
              }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.foreground }}>
                  Invoice Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                      Invoice Number
                    </p>
                    <p className="font-medium" style={{ color: theme.colors.foreground }}>
                      {invoiceData.invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                      Date
                    </p>
                    <p className="font-medium" style={{ color: theme.colors.foreground }}>
                      {invoiceData.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                      Customer
                    </p>
                    <p className="font-medium" style={{ color: theme.colors.foreground }}>
                      {customer.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="p-6 rounded-lg border" style={{ 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border 
              }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.foreground }}>
                  Items Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.mutedForeground }}>Total Items:</span>
                    <span className="font-medium" style={{ color: theme.colors.foreground }}>
                      {invoiceData.items.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.mutedForeground }}>Total Quantity:</span>
                    <span className="font-medium" style={{ color: theme.colors.foreground }}>
                      {invoiceData.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="border-t pt-3" style={{ borderColor: theme.colors.border }}>
                    <div className="flex justify-between">
                      <span className="font-medium" style={{ color: theme.colors.foreground }}>
                        Total Amount:
                      </span>
                      <span className="font-bold text-xl" style={{ color: theme.colors.primary }}>
                        Rs.{invoiceData.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Result */}
              {processResult && (
                <div className={`p-4 rounded-lg border ${
                  processResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {processResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      processResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {processResult.success ? 'Success!' : 'Error'}
                    </span>
                  </div>
                  {processResult.success ? (
                    <p className="text-green-700 text-sm">
                      Invoice processed successfully. Stock has been updated.
                    </p>
                  ) : (
                    <div className="text-red-700 text-sm">
                      {processResult.errors.map((error, index) => (
                        <p key={index}>{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleProceed}
                  disabled={isProcessing || processResult?.success}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.primaryForeground,
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Proceed & Update Stock'}
                </button>
                
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-3 rounded-lg font-medium border transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: theme.colors.border,
                    color: theme.colors.foreground,
                  }}
                >
                  Cancel & Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 