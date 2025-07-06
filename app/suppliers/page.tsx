'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, MapPin, FileText, Trash2, Truck } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { AddSupplierModal } from '@/components/add-supplier-modal';
import { useSupplierStore, SupplierFormData } from '@/lib/store/suppliers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  
  // Zustand store
  const { suppliers, addSupplier, deleteSupplier, searchSuppliers, initializeSuppliers } = useSupplierStore();

  // Initialize suppliers on component mount
  useEffect(() => {
    initializeSuppliers();
  }, [initializeSuppliers]);

  const filteredSuppliers = searchTerm 
    ? searchSuppliers(searchTerm)
    : suppliers;

  const handleAddSupplier = (supplierData: SupplierFormData) => {
    addSupplier(supplierData);
  };

  const handleDeleteSupplier = (supplierId: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(supplierId);
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
          Suppliers
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search suppliers..."
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
          
          {/* Add Supplier Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-lg border" style={{ borderColor: theme.colors.border }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
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
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {suppliers.length === 0 ? (
                    // No suppliers at all
                    <div className="space-y-4">
                      <div className="text-4xl">🚚</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.foreground }}>
                          No Suppliers Yet
                        </h3>
                        <p className="text-sm mb-4" style={{ color: theme.colors.mutedForeground }}>
                          Start by adding your first supplier
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
                          Add Your First Supplier
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Suppliers exist but search returned no results
                    <div className="space-y-4">
                      <div className="text-4xl">🔍</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2" style={{ color: theme.colors.foreground }}>
                          No Suppliers Found
                        </h3>
                        <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                          No suppliers match your search term &ldquo;{searchTerm}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Truck className="h-4 w-4 text-orange-600" />
                      </div>
                      {supplier.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {formatMobile(supplier.mobile)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">
                        {supplier.address || 'No address provided'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-mono">
                        {supplier.gstNumber || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                    {formatDate(supplier.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete supplier"
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

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSupplier={handleAddSupplier}
      />
    </div>
  );
} 