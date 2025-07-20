'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/lib/use-theme';
import { AddProductModal } from '@/components/add-product-modal';
import { CartSidebar } from '@/components/cart-sidebar';
import { useProductStore, ProductFormData } from '@/lib/store/products';
import { useCartStore } from '@/lib/store/cart';
import { CartBadge } from '@/components/cart-badge';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  
  // Zustand stores
  const { 
    products, 
    loading, 
    error, 
    fetchProducts, 
    addProduct, 
    searchProducts, 
    clearError 
  } = useProductStore();
  const { addToCart, toggleCart } = useCartStore();

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = searchTerm 
    ? searchProducts(searchTerm)
    : products;

  const handleAddProduct = async (productData: ProductFormData) => {
    const success = await addProduct(productData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
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
          
          {/* Cart and Add Product Buttons */}
          <div className="flex gap-3">
            {/* Cart Toggle Button */}
            <button
              onClick={toggleCart}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 relative"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.secondaryForeground,
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              <CartBadge />
            </button>

            {/* Add Product Button */}
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
              }}
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: theme.colors.mutedForeground }}>Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: theme.colors.foreground }}>
            Error Loading Products
          </h2>
          <p className="text-lg mb-4" style={{ color: theme.colors.mutedForeground }}>
            {error}
          </p>
          <button
            onClick={() => { clearError(); fetchProducts(); }}
            className="px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <div className="text-4xl text-gray-400">📦</div>
              </div>
              
              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-base mb-1.5 line-clamp-2" style={{ color: theme.colors.foreground }}>
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                    ₹{product.price.toLocaleString()}
                  </p>
                  <div className="text-sm" style={{ color: theme.colors.mutedForeground }}>
                    {product.quantity} {product.unit}
                  </div>
                </div>
                
                {/* In/Out Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addToCart(product, 'in')}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 bg-green-600 text-white"
                  >
                    In
                  </button>
                  <button
                    onClick={() => addToCart(product, 'out')}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 bg-blue-600 text-white"
                  >
                    Out
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* No Results Message */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          {products.length === 0 ? (
            // No products at all - encourage user to add first product
            <div className="space-y-4">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                No Products Yet
              </h2>
              <p className="text-lg mb-6" style={{ color: theme.colors.mutedForeground }}>
                Get started by adding your first product to the inventory
              </p>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-lg transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.primaryForeground,
                }}
              >
                <Plus className="h-5 w-5" />
                Add Your First Product
              </button>
            </div>
          ) : (
            // Products exist but search returned no results
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: theme.colors.foreground }}>
                No Products Found
              </h2>
              <p className="text-lg" style={{ color: theme.colors.mutedForeground }}>
                No products match your search term &ldquo;{searchTerm}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  );
} 