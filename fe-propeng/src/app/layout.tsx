"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/context/AuthContext';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to set isClient to true after component mounts
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Custom handler for breadcrumb navigation
  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    router.push(href);
  };

  // Determine breadcrumbs based on pathname
  let breadcrumbs: { label: string; href?: string; current?: boolean }[] = [];

  if (pathname === "/profil") {
    breadcrumbs = [{ label: "Profil", current: true }];
  } else if (pathname.includes("/profil/@admin")) {
    breadcrumbs = [
      { label: "Profil", href: "/profil" },
      { label: "Admin", current: true },
    ];
  } else if (pathname.includes("/profil/@student")) {
    breadcrumbs = [
      { label: "Profil", href: "/profil" },
      { label: "Student", current: true },
    ];
  } else if (pathname.includes("/profil/@teacher")) {
    breadcrumbs = [
      { label: "Profil", href: "/profil" },
      { label: "Teacher", current: true },
    ];
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header section */}
            <header className="flex h-16 shrink-0 items-center border-b">
              <div className="flex items-center px-4">
                {/* Header content if needed */}
              </div>
            </header>
            
            {/* Breadcrumbs in a separate container */}
            {isClient && breadcrumbs.length > 0 && (
              <div className="px-6 py-4 border-b">
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((breadcrumb, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {breadcrumb.current ? (
                            <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                          ) : (
                            <a
                              href={breadcrumb.href || "#"}
                              onClick={(e) => breadcrumb.href && handleBreadcrumbClick(breadcrumb.href, e)}
                              className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                              {breadcrumb.label}
                            </a>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            )}
            
            {/* Main content */}
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
