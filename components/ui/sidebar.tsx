"use client";

import React, { createContext, useContext, useState } from "react";
import { LucideMenu } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarContextType = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <div className="flex h-screen w-screen overflow-hidden">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "fixed top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-md bg-white dark:bg-neutral-900 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
        className
      )}
    >
      <LucideMenu className="h-5 w-5" />
    </button>
  );
} 