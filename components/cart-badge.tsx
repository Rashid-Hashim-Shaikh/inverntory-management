'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { useTheme } from '@/lib/use-theme';

export function CartBadge() {
  const theme = useTheme();
  const { getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setMounted(true);
    setTotalItems(getTotalItems());
  }, [getTotalItems]);

  // Don't render anything until client-side
  if (!mounted) {
    return null;
  }

  if (totalItems === 0) {
    return null;
  }

  return (
    <span
      className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs flex items-center justify-center font-bold"
      style={{
        backgroundColor: theme.colors.destructive,
        color: theme.colors.destructiveForeground,
      }}
    >
      {totalItems}
    </span>
  );
} 