'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, MapPin, FileText, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { AddCustomerModal } from '@/components/add-customer-modal';
import { useCustomerStore, CustomerFormData } from '@/lib/store/customers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  
  // Zustand store
  const { customers, addCustomer, deleteCustomer, searchCustomers, initializeCustomers } = useCustomerStore();

  // Initialize customers on component mount
  useEffect(() => {
    initializeCustomers();
  }, [initializeCustomers]);

  const filteredCustomers = searchTerm 
    ? searchCustomers(searchTerm)
    : customers;

  const handleAddCustomer = (customerData: CustomerFormData) => {
    addCustomer(customerData);
  };

  const handleDeleteCustomer = (customerId: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMobile = (mobile: string) => {
    // Format mobile number as +91 XXXXX XXXXX
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.foreground }}>
          Customers
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                color: theme.colors.foreground,
              }}
            />
          </div>
          
          {/* Add Customer Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-lg border" style={{ borderColor: theme.colors.border }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile
                </div>
              </TableHead>
              <TableHead className="w-[250px]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  GST Number
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Added On</TableHead>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {customers.length === 0 ? (
                    // No customers at all
                    <div className="space-y-4">
                      <div className="text-4xl">👥</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.foreground }}>
                          No Customers Yet
                        </h3>
                        <p className="text-sm mb-4" style={{ color: theme.colors.mutedForeground }}>
                          Start by adding your first customer
                        </p>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: theme.colors.primary,
                            color: theme.colors.primaryForeground,
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add Your First Customer
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Customers exist but search returned no results
                    <div className="space-y-4">
                      <div className="text-4xl">🔍</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.foreground }}>
                          No Customers Found
                        </h3>
                        <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                          No customers match your search term &ldquo;{searchTerm}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      {customer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {formatMobile(customer.mobile)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">
                        {customer.address || 'No address provided'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-mono">
                        {customer.gstNumber || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCustomer={handleAddCustomer}
      />
    </div>
  );
} 