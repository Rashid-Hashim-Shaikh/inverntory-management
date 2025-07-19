'use client';

import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useTheme } from '@/lib/use-theme';
import { ProductFormData } from '@/lib/store/products';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductFormData) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  quantity?: string;
  unit?: string;
  category?: string;
}

export function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    quantity: 1,
    unit: 'pcs',
    category: 'General',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await onAddProduct(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      unit: 'pcs',
      category: 'General',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              borderColor: errors.name ? '#ef4444' : theme.colors.border,
              backgroundColor: theme.colors.input,
              color: theme.colors.foreground,
            }}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              borderColor: errors.description ? '#ef4444' : theme.colors.border,
              backgroundColor: theme.colors.input,
              color: theme.colors.foreground,
            }}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Price Field */}
        <div>
          <label className="block text-sm font-medium mb-2">Price</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                borderColor: errors.price ? '#ef4444' : theme.colors.border,
                backgroundColor: theme.colors.input,
                color: theme.colors.foreground,
              }}
            />
          </div>
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price}</p>
          )}
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                borderColor: errors.quantity ? '#ef4444' : theme.colors.border,
                backgroundColor: theme.colors.input,
                color: theme.colors.foreground,
              }}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                borderColor: errors.unit ? '#ef4444' : theme.colors.border,
                backgroundColor: theme.colors.input,
                color: theme.colors.foreground,
              }}
            >
              <option value="pcs">Pieces</option>
              <option value="kg">Kilograms</option>
              <option value="g">Grams</option>
              <option value="l">Liters</option>
              <option value="ml">Milliliters</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="set">Set</option>
              <option value="pair">Pair</option>
              <option value="dozen">Dozen</option>
            </select>
            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            placeholder="Enter category (e.g., Electronics, Clothing)"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              borderColor: errors.category ? '#ef4444' : theme.colors.border,
              backgroundColor: theme.colors.input,
              color: theme.colors.foreground,
            }}
          />
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
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
            Add Product
          </button>
        </div>
      </form>
    </Modal>
  );
} 