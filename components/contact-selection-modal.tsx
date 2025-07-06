'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, User, Truck, Phone, MapPin } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useTheme } from '@/lib/use-theme';
import { useCustomerStore, Customer, CustomerFormData } from '@/lib/store/customers';
import { useSupplierStore, Supplier, SupplierFormData } from '@/lib/store/suppliers';
import { AddCustomerModal } from '@/components/add-customer-modal';
import { AddSupplierModal } from '@/components/add-supplier-modal';

interface ContactSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'customer' | 'supplier';
  onSelect: (contact: Customer | Supplier) => void;
}

export function ContactSelectionModal({ isOpen, onClose, type, onSelect }: ContactSelectionModalProps) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Stores
  const { customers, searchCustomers, addCustomer, initializeCustomers } = useCustomerStore();
  const { suppliers, searchSuppliers, addSupplier, initializeSuppliers } = useSupplierStore();

  // Initialize data on component mount
  useEffect(() => {
    if (type === 'customer') {
      initializeCustomers();
    } else {
      initializeSuppliers();
    }
  }, [type, initializeCustomers, initializeSuppliers]);

  const contacts = type === 'customer' ? customers : suppliers;
  const filteredContacts = searchTerm 
    ? (type === 'customer' ? searchCustomers(searchTerm) : searchSuppliers(searchTerm))
    : contacts;

  const handleAddContact = (contactData: any) => {
    if (type === 'customer') {
      addCustomer(contactData);
    } else {
      addSupplier(contactData);
    }
    setShowAddModal(false);
  };

  const handleSelectContact = (contact: Customer | Supplier) => {
    onSelect(contact);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setShowAddModal(false);
    onClose();
  };

  const formatMobile = (mobile: string) => {
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  const title = type === 'customer' ? 'Select Customer' : 'Select Supplier';
  const Icon = type === 'customer' ? User : Truck;
  const addButtonText = type === 'customer' ? 'Add New Customer' : 'Add New Supplier';
  const emptyStateText = type === 'customer' ? 'No customers found' : 'No suppliers found';
  const createText = type === 'customer' ? 'Create New Customer' : 'Create New Supplier';

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={title}>
        <div className="w-full max-w-lg mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`Search ${type}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.foreground,
                }}
              />
            </div>
          </div>

          {/* Add New Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.foreground,
              }}
            >
              <Plus className="h-4 w-4" />
              {addButtonText}
            </button>
          </div>

          {/* Contacts List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">
                  {type === 'customer' ? '👥' : '🚚'}
                </div>
                <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                  {contacts.length === 0 ? (
                    <>No {type}s yet. {createText} to get started.</>
                  ) : (
                    <>{emptyStateText} matching &ldquo;{searchTerm}&rdquo;</>
                  )}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: theme.colors.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      type === 'customer' ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        type === 'customer' ? 'text-blue-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" style={{ color: theme.colors.foreground }}>
                        {contact.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.mutedForeground }}>
                        <Phone className="h-3 w-3" />
                        {formatMobile(contact.mobile)}
                      </div>
                      {contact.address && (
                        <div className="flex items-start gap-2 text-xs mt-1" style={{ color: theme.colors.mutedForeground }}>
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{contact.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-6">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.foreground,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Contact Modals */}
      {type === 'customer' ? (
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddCustomer={handleAddContact}
        />
      ) : (
        <AddSupplierModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddSupplier={handleAddContact}
        />
      )}
    </>
  );
} 