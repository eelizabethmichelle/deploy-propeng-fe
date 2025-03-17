
"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useRefresh } from "@/context/RefreshContext";

interface CustomBreadcrumbLinkProps {
  href: string;
  children: React.ReactNode;
}

export function CustomBreadcrumbLink({ href, children }: CustomBreadcrumbLinkProps) {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerRefresh(); // Trigger data refresh
    router.push(href); // Navigate to the link
  };
  
  return (
    <a href={href} onClick={handleClick} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
      {children}
    </a>
  );
}
