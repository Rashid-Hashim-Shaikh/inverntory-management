'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Download, Receipt } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { useTransactionStore, Transaction } from '@/lib/store/transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TransactionsPage() {
  const theme = useTheme();
  const { transactions, searchTransactions } = useTransactionStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');

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
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                onChange={(e) => setTypeFilter(e.target.value as any)}
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
                  <TableHead style={{ color: theme.colors.mutedForeground }}>Actions</TableHead>
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
                        <button
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" style={{ color: theme.colors.mutedForeground }} />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4" style={{ color: theme.colors.mutedForeground }} />
                        </button>
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