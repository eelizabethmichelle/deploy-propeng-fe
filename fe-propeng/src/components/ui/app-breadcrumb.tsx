"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface AppBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export function AppBreadcrumb({ items, onNavigate }: AppBreadcrumbProps) {
  const router = useRouter();

  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href);
    }
  };

  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="md:block">
              {item.current ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <a
                  href={item.href || "#"}
                  onClick={(e) => item.href && handleBreadcrumbClick(item.href, e)}
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </a>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
