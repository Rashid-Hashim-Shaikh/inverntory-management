"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LucideHome, 
  LucideUsers,
  LucideSettings,
  LucidePackage,
  LucideLayoutDashboard,
  LucideTruck,
  LucideReceipt,
  LucideShoppingCart,
  LucideArrowUpDown
} from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { UserProfile } from "./user-profile";

const navItems = [
  { label: "Dashboard", icon: LucideLayoutDashboard, href: "/" },
  { label: "Products", icon: LucidePackage, href: "/products" },
  { label: "Sales", icon: LucideShoppingCart, href: "/sales" },
  { label: "Purchases", icon: LucideArrowUpDown, href: "/purchases" },
  { label: "Transactions", icon: LucideReceipt, href: "/transactions" },
  { label: "Customers", icon: LucideUsers, href: "/customers" },
  { label: "Suppliers", icon: LucideTruck, href: "/suppliers" },
  { label: "Settings", icon: LucideSettings, href: "/settings" },
];

export function AppSidebar() {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-white dark:bg-neutral-950 dark:border-neutral-800 transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-center border-b dark:border-neutral-800">
        <h1 className={cn("font-semibold text-xl", !isOpen && "sr-only")}>
          Inventory
        </h1>
        {!isOpen && (
          <LucideHome className="h-6 w-6" />
        )}
      </div>
      
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t dark:border-neutral-800">
        <UserProfile />
      </div>
    </aside>
  );
} 