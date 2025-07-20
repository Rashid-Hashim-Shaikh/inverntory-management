'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';

export function CartCount() {
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setMounted(true);
    setTotalItems(getTotalItems());
  }, [getTotalItems]);

  // Don't render anything until client-side
  if (!mounted) {
    return <span>(0)</span>;
  }

  return <span>({totalItems})</span>;
} 