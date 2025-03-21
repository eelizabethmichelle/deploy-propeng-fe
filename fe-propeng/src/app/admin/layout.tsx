// src/app/admin/layout.tsx
"use client";

import React from "react";
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

interface AdminLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export default function AdminLayout({
  children,
  hideSidebar,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    if (href === "/admin/kelas" && pathname.includes("/admin/kelas/detail")) {
      localStorage.setItem("kelas_data_refresh", "true");
    }
    router.push(href);
  };

  const breadcrumbMap: { [key: string]: { label: string; href?: string }[] } = {
    "/admin/kelas": [{ label: "Manajemen Kelas" }],
    "/admin/kelas/tambah": [
      { label: "Manajemen Kelas", href: "/admin/kelas" },
      { label: "Tambah Kelas" },
    ],
    "/admin/akun": [{ label: "Manajemen Akun" }],
    "/admin/akun/tambah": [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Tambah Akun" },
    ],
    "/admin/mata-pelajaran": [{ label: "Mata Pelajaran" }],
    "/admin/mata-pelajaran/tambah": [
      { label: "Mata Pelajaran", href: "/admin/mata-pelajaran" },
      { label: "Tambah Mata Pelajaran" },
    ],
  };

  let breadcrumbs = breadcrumbMap[pathname] || [];
  if (pathname.includes("/admin/kelas/detail")) {
    breadcrumbs = [
      { label: "Manajemen Kelas", href: "/admin/kelas" },
      { label: "Detail Kelas" },
    ];
  }

  if (pathname.includes("/admin/akun/detil")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Detail Akun" },
    ];
  }

  if (pathname.includes("admin/akun/ubah")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Ubah Akun" },
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
                      <BreadcrumbItem>
                        {breadcrumb.href ? (
                          <a
                            href={breadcrumb.href}
                            onClick={(e) => handleBreadcrumbClick(breadcrumb.href, e)}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            {breadcrumb.label}
                          </a>
                        ) : (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
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
