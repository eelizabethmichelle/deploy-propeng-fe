// src/app/admin/layout.tsx
"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Change the export format to match Next.js layout requirements
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hideSidebar = false; // Set a default value or handle it differently

  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    if (href === "/admin/kelas" && pathname.includes("/admin/kelas/detail")) {
      localStorage.setItem("kelas_data_refresh", "true");
    }
    router.push(href);
  };

  // Rest of your code remains the same
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
    "/admin/linimasa": [{ label: "Linimasa Pengajuan Mata Pelajaran Peminatan" }],
    "/admin/linimasa/tambah": [
      { label: "Linimasa Pengajuan Mata Pelajaran Peminatan", href: "/admin/linimasa" },
      { label: "Tambah Linimasa" },
    ],
    "/admin/linimasa/[linimasaId]": [
      { label: "Linimasa Pengajuan Mata Pelajaran Peminatan", href: "/admin/linimasa" },
      { label: "Submisi" },
    ],
  };

  let breadcrumbs = breadcrumbMap[pathname] || [];
  if (pathname.includes("/admin/kelas/detail")) {
    breadcrumbs = [
      { label: "Manajemen Kelas", href: "/admin/kelas" },
      { label: "Detail Kelas" },
    ];
  }

  if (pathname.includes("/admin/linimasa")) {
    breadcrumbs = [
      { label: "Linimasa Pengajuan Mata Pelajaran Peminatan", href: "/admin/linimasa" },
      { label: "Submisi" },
    ];
  }

  if (pathname.includes("/admin/linimasa") && pathname.includes("detail")) {
    const parts = pathname.split("/");
    const eventId = parts[3];
    breadcrumbs = [
      { label: "Linimasa Pengajuan Mata Pelajaran Peminatan", href: "/admin/linimasa" },
      { label: "Submisi", href: `/admin/linimasa/${eventId}` },
      { label: "Persetujuan" },
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
