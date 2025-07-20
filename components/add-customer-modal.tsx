'use client';

import { useState } from 'react';
import { User, Phone, MapPin, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useTheme } from '@/lib/use-theme';
import { CustomerFormData } from '@/lib/store/customers';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (customerData: CustomerFormData) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  mobile?: string;
  address?: string;
}

export function AddCustomerModal({ isOpen, onClose, onAddCustomer }: AddCustomerModalProps) {
  const theme = useTheme();
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    mobile: '',
    address: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Customer name must be at least 2 characters';
    }

    // Email validation (optional but if provided, should be valid)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Invalid email format';
      }
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const customerData: CustomerFormData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.replace(/\D/g, ''), // Remove non-digits
      address: formData.address.trim(),
    };

    await onAddCustomer(customerData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      address: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Customer">
      <div className="w-full max-w-md mx-auto">

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.foreground }}>
              Customer Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: errors.name ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.foreground,
                }}
                placeholder="Enter customer name"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.foreground }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: errors.email ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.foreground,
                }}
                placeholder="Enter email address (optional)"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.foreground }}>
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: errors.mobile ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.foreground,
                }}
                placeholder="Enter mobile number"
              />
            </div>
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.foreground }}>
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{
                  borderColor: errors.address ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.background,
                  color: theme.colors.foreground,
                }}
                placeholder="Enter customer address (optional)"
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-gray-50"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.foreground,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
              }}
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 