'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/lib/store/products';
import { useSupplierStore } from '@/lib/store/suppliers';
import { useTransactionStore } from '@/lib/store/transactions';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Package, AlertCircle, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/store/products';
import { isAuthenticated } from '@/lib/auth-utils';

interface PurchaseItem {
  product: Product;
  quantity: number;
  price: number;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { products, fetchProducts, loading: productsLoading, updateInventory } = useProductStore();
  const { suppliers, fetchSuppliers, loading: suppliersLoading } = useSupplierStore();
  const { addTransaction, loading: transactionLoading } = useTransactionStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    console.log('Purchases page: Fetching products and suppliers...');
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  // Client-side filtering and searching
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToPurchase = (product: Product) => {
    const existingItemIndex = purchaseItems.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...purchaseItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1
      };
      setPurchaseItems(updatedItems);
    } else {
      // Add new item
      setPurchaseItems([...purchaseItems, {
        product,
        quantity: 1,
        price: product.price
      }]);
    }
    toast.success(`${product.name} added to purchase`);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setPurchaseItems(purchaseItems.filter(item => item.product.id !== productId));
    } else {
      setPurchaseItems(purchaseItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    setPurchaseItems(purchaseItems.map(item => 
      item.product.id === productId 
        ? { ...item, price: newPrice }
        : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleProcessPurchase = async () => {
    if (purchaseItems.length === 0) {
      toast.error('No items in purchase!');
      return;
    }

    if (!selectedSupplier) {
      toast.error('Please select a supplier!');
      return;
    }

    setIsProcessing(true);

    try {
      // First, update inventory for all items
      for (const item of purchaseItems) {
        const success = await updateInventory(item.product.id, item.quantity);
        if (!success) {
          toast.error(`Failed to update inventory for ${item.product.name}`);
          setIsProcessing(false);
          return;
        }
      }

      // Create transaction
      const invoiceNumber = `PUR-${Date.now()}`;
      const currentDate = new Date().toLocaleDateString('en-IN');
      const totalAmount = calculateTotal();

      const transactionData = {
        type: 'purchase' as const,
        invoiceNumber,
        date: currentDate,
        supplierId: selectedSupplier,
        customerId: undefined,
        items: purchaseItems.map(item => ({
          id: `${item.product.id}-${Date.now()}`,
          productId: item.product.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          type: 'in' as const,
          addedAt: Date.now(),
        })),
        totalAmount,
        totalItems: purchaseItems.length,
        totalQuantity: purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
        status: 'completed' as const,
      };

      const result = await addTransaction(transactionData);

      if (result) {
        toast.success('Purchase completed successfully!');
        setPurchaseItems([]);
        setSelectedSupplier('');
        router.push('/transactions');
      } else {
        toast.error('Failed to create transaction');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);

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
              <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
              <p className="text-gray-600">Create new purchase transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Package className="h-5 w-5" />
                <span>{purchaseItems.length} items</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <IndianRupee className="h-5 w-5" />
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {!isUserAuthenticated ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please log in to access the purchases page.</p>
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
                              onClick={() => handleAddToPurchase(product)}
                              className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
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

            {/* Purchase Details Section */}
            <div className="w-96 bg-white border-l flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Purchase Details</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select 
                    value={selectedSupplier} 
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliersLoading ? (
                      <option disabled>Loading suppliers...</option>
                    ) : (
                      suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} - {supplier.mobile}
                        </option>
                      ))
                    )}
                  </select>
                  {selectedSupplierData && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSupplierData.email} • {selectedSupplierData.address}
                    </p>
                  )}
                </div>

                {/* Purchase Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Items ({purchaseItems.length})</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {purchaseItems.map((item) => (
                      <div key={item.product.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-gray-600">{item.product.category} • {item.product.unit}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Price</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                        
                        <div className="text-right mt-1">
                          <span className="text-sm font-semibold">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {purchaseItems.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No items in purchase
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t space-y-2">
                <button
                  onClick={handleProcessPurchase}
                  disabled={purchaseItems.length === 0 || !selectedSupplier || isProcessing}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Complete Purchase'}
                </button>
                <button
                  onClick={() => setPurchaseItems([])}
                  disabled={purchaseItems.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 