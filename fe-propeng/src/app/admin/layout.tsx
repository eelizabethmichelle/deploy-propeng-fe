"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// This is the correct format for a Next.js layout component
export default function Layout({
  children,
  hideSidebar = false,
}: {
  children: React.ReactNode;
  hideSidebar?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
      { label: loading ? "Loading..." : `Detail Kelas ${className || ""}` },
    ];
  }

  return (
    <SidebarProvider>
      {!hideSidebar && <AppSidebar />}
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
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
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
