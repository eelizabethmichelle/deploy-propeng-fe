"use client";

import React, { useState, useEffect } from "react";
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

// Define a type for the layout props
type AdminLayoutProps = {
  children: React.ReactNode;
  hideSidebar?: boolean;
};

// Create a separate Layout component
function AdminLayoutContent({ children, hideSidebar = false }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Custom handler for breadcrumb navigation
  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return; // Avoids calling router.push with undefined
    e.preventDefault();

    // If navigating to class list from detail page, signal refresh
    if (href === "/admin/kelas" && pathname.includes("/admin/kelas/detail")) {
      localStorage.setItem("kelas_data_refresh", "true");
    }

    router.push(href);
  };

  // Determine breadcrumbs based on pathname
  let breadcrumbs: { label: string; href?: string; current?: boolean }[] = [];

  if (pathname === "/admin/kelas") {
    breadcrumbs = [{ label: "Manajemen Kelas", current: true }];
  } else if (pathname === "/admin/kelas/tambah") {
    breadcrumbs = [
      { label: "Manajemen Kelas", href: "/admin/kelas" },
      { label: "Tambah Kelas", current: true },
    ];
  } else if (pathname.includes("/admin/kelas/detail")) {
    breadcrumbs = [
      { label: "Manajemen Kelas", href: "/admin/kelas" },
      { label: loading ? "Loading..." : `Detail Kelas ${className || ""}`, current: true },
    ];
  } else if (pathname === "/admin/akun") {
    breadcrumbs = [{ label: "Manajemen Akun", current: true }];
  } else if (pathname.includes("/admin/akun/detil")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Detail Akun", current: true },
    ];
  } else if (pathname === "/admin/akun/tambah") {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Tambah Akun", current: true },
    ];
  } else if (pathname.includes("/admin/akun/ubah")) {
    breadcrumbs = [
      { label: "Manajemen Akun", href: "/admin/akun" },
      { label: "Ubah Detil Akun", current: true },
    ];
  } else if (pathname === "/admin/mata-pelajaran") {
    breadcrumbs = [{ label: "Mata Pelajaran", current: true }];
  } else if (pathname === "/admin/mata-pelajaran/tambah") {
    breadcrumbs = [
      { label: "Mata Pelajaran", href: "/admin/mata-pelajaran" },
      { label: "Tambah Mata Pelajaran", current: true },
    ];
  } else if (pathname.includes("/admin/mata-pelajaran/ubah")) {
    breadcrumbs = [
      { label: "Mata Pelajaran", href: "/admin/mata-pelajaran" },
      { label: "Ubah Mata Pelajaran", current: true },
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
                            onClick={(e) => breadcrumb.href && handleBreadcrumbClick(breadcrumb.href, e)}
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

// Add the missing default export function
export default function RootLayout({
  children,
  hideSidebar,
}: {
  children: React.ReactNode;
  hideSidebar?: boolean;
}) {
  return <AdminLayoutContent children={children} hideSidebar={hideSidebar} />;
}
