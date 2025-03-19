// src/app/admin/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
  hideSidebar,
}: {
  children: React.ReactNode;
  hideSidebar?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Extract class ID from pathname if we're on a detail page
  const classId = pathname.includes("/admin/detail-kelas/") 
    ? pathname.split("/").pop() 
    : null;
  
  // Fetch class name if we're on a detail page
  useEffect(() => {
    if (!classId) return;

    const fetchClassName = async () => {
      try {
        setLoading(true);
        
        // Get auth token
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
        
        // Check if token exists
        if (!token) {
          console.error("No authentication token found");
          router.push("/login");
          return;
        }
        
        // Make API request with proper error handling
        const response = await fetch(`http://127.0.0.1:8000/api/kelas/${classId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem("accessToken");
            sessionStorage.removeItem("accessToken");
            router.push("/login");
            return;
          }
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        
        // Check API response status
        if (data.status === 201) {
          setClassName(data.namaKelas || "");
        } else {
          console.warn("API returned non-success status:", data.status);
          setClassName(""); // Set empty class name on error
        }
      } catch (error) {
        console.error("Error fetching class name:", error);
        setClassName(""); // Set empty class name on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassName();
  }, [classId, router]);
  
  // Custom handler for breadcrumb navigation
  const handleBreadcrumbClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // If navigating to class list from detail page, signal refresh
    if (href === "/admin/lihat-kelas" && pathname.includes("/admin/detail-kelas/")) {
      localStorage.setItem('kelas_data_refresh', 'true');
    }
    
    router.push(href);
  };
  
  // Determine breadcrumbs based on pathname
  let breadcrumbs: any[] = [];
  
  if (pathname.includes("/admin/lihat-kelas")) {
    breadcrumbs = [
      { label: "Kelas", href: "/admin/lihat-kelas", current: true },
    ];
  } else if (pathname.includes("/admin/tambah-kelas")) {
    breadcrumbs = [
      { label: "Kelas", href: "/admin/lihat-kelas" },
      { label: "Tambah Kelas", current: true },
    ];
  } else if (pathname.includes("/admin/detail-kelas/")) {
    breadcrumbs = [
      { label: "Kelas", href: "/admin/lihat-kelas" },
      { label: loading ? "Loading..." : (className ? `Detail Kelas ${className}` : "Detail Kelas"), current: true },
    ];
  } else if (pathname.includes("/admin/akun")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun", current: true },
    ];
  } else if (pathname.includes("/admin/akun/detil")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: loading ? "Loading..." : "Detail Akun", current: true },
    ];
  } else if (pathname.includes("/admin/akun/tambah")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: loading ? "Loading..." : "Tambah Akun", current: true },
    ];
  } else if (pathname.includes("/admin/akun/ubah")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: loading ? "Loading..." : "Ubah Detil Akun", current: true },
    ];
  }

  return (
    <SidebarProvider>
      {!hideSidebar && <AppSidebar />}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Render breadcrumbs directly next to sidebar icon */}
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem className="md:block">
                        {breadcrumb.current ? (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                        ) : (
                          <a 
                            href={breadcrumb.href || "#"} 
                            onClick={(e) => handleBreadcrumbClick(breadcrumb.href, e)}
                            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            {breadcrumb.label}
                          </a>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}