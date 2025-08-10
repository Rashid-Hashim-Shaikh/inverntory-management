'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/lib/store/products';
import { useCustomerStore } from '@/lib/store/customers';
import { useCartStore } from '@/lib/store/cart';
import { useTransactionStore } from '@/lib/store/transactions';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, ShoppingCart, Receipt, Package, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/store/products';
import { isAuthenticated } from '@/lib/auth-utils';

export default function SalesPage() {
  const router = useRouter();
  const { products, fetchProducts, loading: productsLoading } = useProductStore();
  const { customers, fetchCustomers, loading: customersLoading } = useCustomerStore();
  const { 
    items, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    processCart,
    getTotalValue,
    getTotalItems 
  } = useCartStore();
  const { addTransaction, loading: transactionLoading } = useTransactionStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    console.log('Sales page: Fetching products and customers...');
    fetchProducts();
    fetchCustomers();
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    setSaleDate(formattedDate);
    
    // Generate invoice number
    const timestamp = Date.now();
    setInvoiceNumber(`SALE-${timestamp}`);
  }, [fetchProducts, fetchCustomers]);

  // Debug logging
  useEffect(() => {
    console.log('Sales page: Products state changed:', { 
      productsCount: products.length, 
      loading: productsLoading,
      products: products.slice(0, 3) // Log first 3 products
    });
  }, [products, productsLoading]);

  // Client-side filtering and searching
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }
    addToCart(product, 'out', 1); // 'out' means selling (reducing inventory)
    toast.success(`${product.name} added to cart`);
  };

  const handleProcessSale = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    if (!selectedCustomer) {
      toast.error('Please select a customer!');
      return;
    }

    try {
      // Process inventory updates
      const inventoryResult = await processCart(async (productId: string, quantityChange: number) => {
        const success = await useProductStore.getState().updateInventory(productId, quantityChange);
        return success;
      });

      if (!inventoryResult.success) {
        toast.error('Failed to update inventory: ' + inventoryResult.errors.join(', '));
        return;
      }

      // Create transaction
      const transactionData = {
        type: 'sale' as const,
        invoiceNumber: invoiceNumber,
        date: saleDate,
        customerId: selectedCustomer,
        supplierId: undefined,
        items: items,
        totalAmount: getTotalValue(),
        totalItems: getTotalItems(),
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        status: 'completed' as const,
      };

      const success = await addTransaction(transactionData);

      if (success) {
        toast.success('Sale completed successfully!');
        clearCart();
        setSelectedCustomer('');
        setInvoiceNumber(`SALE-${Date.now()}`);
        router.push('/transactions');
      } else {
        toast.error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  // Check if user is authenticated
  const isUserAuthenticated = isAuthenticated();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600">Create new sales transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <ShoppingCart className="h-5 w-5" />
                <span>{items.length} items</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Receipt className="h-5 w-5" />
                <span>₹{getTotalValue().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {!isUserAuthenticated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to access the sales page.</p>
              <button 
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Products Section */}
            <div className="flex-1 flex flex-col">
              {/* Search and Filters */}
              <div className="bg-white p-4 border-b">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {productsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div className="text-gray-500">Loading products...</div>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No products found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {products.length === 0 ? 'No products in database' : 'No products match your search'}
                      </p>
                      <button 
                        onClick={() => fetchProducts()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Refresh Products
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{product.name}</h3>
                              <p className="text-sm text-gray-600">{product.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">₹{product.price}</p>
                              <p className="text-xs text-gray-500">Stock: {product.quantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {product.category} • {product.unit}
                            </div>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={product.quantity <= 0}
                              className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Section */}
            <div className="w-96 bg-white border-l flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Sale Details</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select 
                    value={selectedCustomer} 
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select customer</option>
                    {customersLoading ? (
                      <option disabled>Loading customers...</option>
                    ) : (
                      customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.mobile}
                        </option>
                      ))
                    )}
                  </select>
                  {selectedCustomerData && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedCustomerData.email} • {selectedCustomerData.address}
                    </p>
                  )}
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                    <input
                      type="text"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cart Items ({items.length})</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No items in cart
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{getTotalValue().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t space-y-2">
                <button
                  onClick={handleProcessSale}
                  disabled={items.length === 0 || !selectedCustomer || transactionLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transactionLoading ? 'Processing...' : 'Complete Sale'}
                </button>
                <button
                  onClick={clearCart}
                  disabled={items.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 