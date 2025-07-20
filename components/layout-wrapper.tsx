'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/auth/');
  
  if (isAuthPage) {
    // For auth pages, render without sidebar
    return (
      <div className="h-screen w-full">
        {children}
      </div>
    );
  }
  
  // For other pages, render with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="h-screen w-full overflow-y-auto">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
} 