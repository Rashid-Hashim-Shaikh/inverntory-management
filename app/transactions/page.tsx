'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Eye, Download, Receipt, ArrowLeft, X } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { useTransactionStore, Transaction } from '@/lib/store/transactions';
import { generateAndPreviewPDF, downloadPDF } from '@/lib/pdf-generator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

export default function TransactionsPage() {
  const theme = useTheme();
  const { 
    transactions, 
    loading, 
    error, 
    fetchTransactions, 
    searchTransactions 
  } = useTransactionStore();
  
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');
  
  // Invoice preview state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Ref to track if we've already processed a transaction to prevent infinite loops
  const processedTransactionId = useRef<string | null>(null);

  // Check if we have a transaction ID from URL params (for direct invoice generation)
  const transactionId = searchParams.get('transactionId');

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle transactionId from URL params for automatic invoice viewing
  useEffect(() => {
    if (transactionId && processedTransactionId.current !== transactionId && transactions.length > 0) {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction && transaction.type === 'sale') {
        console.log('Auto-opening invoice for transaction:', transactionId);
        setSelectedTransaction(transaction);
        processedTransactionId.current = transactionId;
        generateInvoice(transaction);
      }
    }
  }, [transactionId, transactions.length]);

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = searchTerm ? searchTransactions(searchTerm) : transactions;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }
    
    return filtered;
  }, [transactions, searchTransactions, searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const styles = {
      sale: 'bg-blue-100 text-blue-800 border-blue-200',
      purchase: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[type]}`}>
        {type === 'sale' ? 'Sale' : 'Purchase'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMobile = (mobile: string) => {
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  // Invoice generation functions
  const generateInvoice = async (transaction: Transaction) => {
    // Only allow invoice generation for sales transactions
    if (transaction.type !== 'sale') {
      toast.error('Invoices can only be generated for sales transactions');
      return;
    }

    // Prevent multiple calls for the same transaction
    if (processedTransactionId.current === transaction.id && pdfDataUri) {
      return;
    }

    // Prevent calling if already generating
    if (isGenerating) {
      return;
    }

    if (!transaction.customer) {
      toast.error('Customer information not found for this transaction');
      return;
    }

    if (!transaction.items || transaction.items.length === 0) {
      toast.error('No items found in this transaction');
      return;
    }

    // Validate that all required fields are present
    if (!transaction.invoiceNumber || !transaction.date || !transaction.totalAmount) {
      toast.error('Transaction data is incomplete. Cannot generate invoice.');
      return;
    }

    console.log('Generating invoice for transaction:', transaction);
    console.log('Transaction items:', transaction.items);
    console.log('Customer:', transaction.customer);

    setIsGenerating(true);
    setPdfDataUri(''); // Clear previous PDF
    
    try {
      const invoiceData = {
        customer: transaction.customer,
        items: transaction.items,
        invoiceNumber: transaction.invoiceNumber,
        date: transaction.date,
        totalAmount: transaction.totalAmount
      };

      console.log('Invoice data being sent to PDF generator:', invoiceData);

      const dataUri = generateAndPreviewPDF(invoiceData);
      console.log('PDF generated successfully, dataUri length:', dataUri.length);
      
      if (dataUri && dataUri.length > 0) {
        setPdfDataUri(dataUri);
        toast.success('Invoice generated successfully!');
      } else {
        throw new Error('Generated PDF data URI is empty');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // Clear previous PDF and generate new one
    setPdfDataUri('');
    processedTransactionId.current = transaction.id; // Mark as processed
    generateInvoice(transaction);
  };

  const handleDownloadInvoice = (transaction: Transaction) => {
    // Only allow invoice download for sales transactions
    if (transaction.type !== 'sale') {
      toast.error('Invoices can only be downloaded for sales transactions');
      return;
    }

    if (!transaction.customer) {
      toast.error('Customer information not found for this transaction');
      return;
    }

    if (!transaction.items || transaction.items.length === 0) {
      toast.error('No items found in this transaction');
      return;
    }

    try {
      const invoiceData = {
        customer: transaction.customer,
        items: transaction.items,
        invoiceNumber: transaction.invoiceNumber,
        date: transaction.date,
        totalAmount: transaction.totalAmount
      };

      downloadPDF(invoiceData);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  const handleBack = () => {
    setSelectedTransaction(null);
    setPdfDataUri('');
    processedTransactionId.current = null; // Reset processed transaction ID
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: theme.colors.mutedForeground }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchTransactions()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Invoice preview state
  if (selectedTransaction && pdfDataUri) {
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
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Transactions</span>
                </button>
                <div>
                  <h1 className="text-xl font-semibold" style={{ color: theme.colors.foreground }}>
                    Invoice Preview
                  </h1>
                  <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                    {selectedTransaction.invoiceNumber} • {selectedTransaction.customer?.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadInvoice(selectedTransaction)}
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
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p style={{ color: theme.colors.mutedForeground }}>Unable to generate PDF preview</p>
                      <button
                        onClick={() => generateInvoice(selectedTransaction)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retry Generation
                      </button>
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
                        {selectedTransaction.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                        Date
                      </p>
                      <p className="font-medium" style={{ color: theme.colors.foreground }}>
                        {formatDate(selectedTransaction.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                        Customer
                      </p>
                      <p className="font-medium" style={{ color: theme.colors.foreground }}>
                        {selectedTransaction.customer?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                        Status
                      </p>
                      {getStatusBadge(selectedTransaction.status)}
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
                        {selectedTransaction.totalItems}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: theme.colors.mutedForeground }}>Total Quantity:</span>
                      <span className="font-medium" style={{ color: theme.colors.foreground }}>
                        {selectedTransaction.totalQuantity}
                      </span>
                    </div>
                    <div className="border-t pt-3" style={{ borderColor: theme.colors.border }}>
                      <div className="flex justify-between">
                        <span className="font-medium" style={{ color: theme.colors.foreground }}>
                          Total Amount:
                        </span>
                        <span className="font-bold text-xl" style={{ color: theme.colors.primary }}>
                          ₹{selectedTransaction.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: theme.colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-8 w-8" style={{ color: theme.colors.primary }} />
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.foreground }}>
              Transaction History
            </h1>
          </div>
          <p className="text-lg" style={{ color: theme.colors.mutedForeground }}>
            View and manage all your sales and purchase transactions
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg border" style={{ 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border 
        }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                style={{ color: theme.colors.mutedForeground }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border,
                  color: theme.colors.foreground,
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'pending' | 'cancelled')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border,
                  color: theme.colors.foreground,
                }}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'sale' | 'purchase')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border,
                  color: theme.colors.foreground,
                }}
              >
                <option value="all">All Types</option>
                <option value="sale">Sales</option>
                <option value="purchase">Purchases</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border overflow-hidden" style={{ 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border 
        }}>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.foreground }}>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No transactions found' 
                  : 'No transactions yet'
                }
              </h3>
              <p style={{ color: theme.colors.mutedForeground }}>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by creating your first sale or purchase transaction'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: theme.colors.border }}>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Invoice #</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Type</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Date</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Contact</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Items</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Quantity</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Amount</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Status</TableHead>
                  <TableHead style={{ color: theme.colors.mutedForeground }}>
                    <div className="flex items-center gap-2">
                      <span>Actions</span>
                      <span className="text-xs text-gray-400">(Invoice for Sales)</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="hover:bg-gray-50"
                    style={{ borderColor: theme.colors.border }}
                  >
                    <TableCell className="font-mono text-sm" style={{ color: theme.colors.foreground }}>
                      {transaction.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.type)}
                    </TableCell>
                    <TableCell style={{ color: theme.colors.foreground }}>
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ color: theme.colors.foreground }}>
                          {transaction.customer?.name || transaction.supplier?.name}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                          {formatMobile(transaction.customer?.mobile || transaction.supplier?.mobile || '')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center" style={{ color: theme.colors.foreground }}>
                      {transaction.totalItems}
                    </TableCell>
                    <TableCell className="text-center" style={{ color: theme.colors.foreground }}>
                      {transaction.totalQuantity}
                    </TableCell>
                    <TableCell className="font-medium" style={{ color: theme.colors.primary }}>
                      Rs.{transaction.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'sale' ? (
                          <>
                            <button
                              onClick={() => handleViewInvoice(transaction)}
                              disabled={isGenerating && selectedTransaction?.id === transaction.id}
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
                              title="View Invoice"
                            >
                              {isGenerating && selectedTransaction?.id === transaction.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              ) : (
                                <Eye className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(transaction)}
                              className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4 text-green-600" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic px-2 py-1 bg-gray-50 rounded">No invoice</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary Cards */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }}>
              <h4 className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                Total Transactions
              </h4>
              <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.foreground }}>
                {filteredTransactions.length}
              </p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }}>
              <h4 className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                Total Sales
              </h4>
              <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.primary }}>
                Rs.{filteredTransactions
                  .filter(t => t.type === 'sale')
                  .reduce((sum, t) => sum + t.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }}>
              <h4 className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                Total Purchases
              </h4>
              <p className="text-2xl font-bold mt-1 text-orange-600">
                Rs.{filteredTransactions
                  .filter(t => t.type === 'purchase')
                  .reduce((sum, t) => sum + t.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }}>
              <h4 className="text-sm font-medium" style={{ color: theme.colors.mutedForeground }}>
                Completed
              </h4>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {filteredTransactions.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 