'use client';

import { useState } from 'react';
import { Upload, IndianRupee } from 'lucide-react';
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
  image?: string;
  purchasePrice?: string;
  sellPrice?: string;
  quantity?: string;
  unit?: string;
}

export function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    image: '',
    purchasePrice: 0,
    sellPrice: 0,
    quantity: 1,
    unit: 'Box',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          image: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.image) {
      newErrors.image = 'Product image is required';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    if (formData.sellPrice <= 0) {
      newErrors.sellPrice = 'Sell price must be greater than 0';
    }

    if (formData.sellPrice <= formData.purchasePrice) {
      newErrors.sellPrice = 'Sell price must be greater than purchase price';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAddProduct(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      image: '',
      purchasePrice: 0,
      sellPrice: 0,
      quantity: 1,
      unit: 'Box',
    });
    setImagePreview('');
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Image</label>
          <div className="flex items-center space-x-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-24 h-24 object-cover rounded-lg border-2"
                  style={{ borderColor: theme.colors.border }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.muted }}
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* File Input */}
            <div className="flex-1">
                             <input
                 type="file"
                 accept="image/*"
                 onChange={handleImageChange}
                 className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer hover:file:bg-opacity-80"
                 style={{
                   color: theme.colors.foreground,
                   backgroundColor: theme.colors.input,
                 }}
               />
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image}</p>
              )}
            </div>
          </div>
        </div>

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

        {/* Price Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Purchase Price</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  borderColor: errors.purchasePrice ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.input,
                  color: theme.colors.foreground,
                }}
              />
            </div>
            {errors.purchasePrice && (
              <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>
            )}
          </div>

                          {/* Sale Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sale Price</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.sellPrice || ''}
                onChange={(e) => handleInputChange('sellPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  borderColor: errors.sellPrice ? '#ef4444' : theme.colors.border,
                  backgroundColor: theme.colors.input,
                  color: theme.colors.foreground,
                }}
              />
            </div>
            {errors.sellPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.sellPrice}</p>
            )}
          </div>
        </div>

        {/* Quantity and Unit Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="1"
              min="1"
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

          {/* Unit */}
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
              <option value="Box">Box</option>
              <option value="Container">Container</option>
              <option value="Piece">Piece</option>
              <option value="Kg">Kg</option>
              <option value="Liter">Liter</option>
              <option value="Pack">Pack</option>
              <option value="Carton">Carton</option>
              <option value="Bottle">Bottle</option>
              <option value="Bag">Bag</option>
              <option value="Roll">Roll</option>
            </select>
            {errors.unit && (
              <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Profit Margin Display */}
        {formData.purchasePrice > 0 && formData.sellPrice > formData.purchasePrice && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.accent }}>
            <p className="text-sm">
              <span className="font-medium">Profit Margin:</span>{' '}
              ₹{(formData.sellPrice - formData.purchasePrice).toFixed(2)} ({' '}
              {(((formData.sellPrice - formData.purchasePrice) / formData.purchasePrice) * 100).toFixed(1)}% )
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-opacity-80"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.secondaryForeground,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-opacity-90"
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