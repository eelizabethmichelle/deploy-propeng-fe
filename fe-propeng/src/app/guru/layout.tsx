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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const hideSidebar = false;

  // Merged breadcrumb maps
  const breadcrumbMap: { [key: string]: { label: string; href?: string }[] } = {
    "/guru/kelas": [{ label: "Manajemen Kelas" }],
    "/guru/kelas/absensi": [
      { label: "Manajemen Kelas", href: "/guru/kelas" },
      { label: "Absensi" },
    ],
    "/guru/mata-pelajaran": [{ label: "Mata Pelajaran" }],
    "/guru/manajemennilai/matapelajaran": [{ label: "Manajemen Nilai" }],
    "/guru/nilai/matapelajaran": [{ label: "Manajemen Nilai" }],
    "/guru/raport": [{ label: "Raport Siswa" }],
  };

  // Generate breadcrumbs based on current pathname
  const generateBreadcrumbs = (pathname: string): { label: string; href?: string }[] => {
    if (pathname.startsWith("/guru/manajemennilai/inputnilai/")) {
      return [
        { label: "Manajemen Nilai", href: "/guru/manajemennilai/matapelajaran" },
        { label: "Input Data Nilai" },
      ];
    } else if (pathname.startsWith("/guru/mata-pelajaran/detil/")) {
      return [
        { label: "Manajemen Nilai", href: "/guru/manajemennilai/matapelajaran" },
        { label: "Atur Komponen Penilaian dan Bobot" },
      ];
    } else if (pathname.includes("/guru/kelas/detail")) {
      return [
        { label: "Manajemen Kelas", href: "/guru/kelas" },
        { label: "Detail Kelas" },
      ];
    } else if (pathname === "/guru/submisi-peminatan") {
      return [
        { label: "Pendaftar Mata Pelajaran Peminatan" },
      ];
    } else if (/^\/guru\/submisi-peminatan\/\d+\/detail\/\d+$/.test(pathname)) {
      return [
        { label: "Pendaftar Mata Pelajaran Peminatan", href: "/guru/submisi-peminatan" },
        { label: "Formulir Persetujuan" },
      ];
    } else if (pathname.includes("/guru/kelas/dashboard-nilai/")) {
      return [
        { label: "Manajemen Kelas", href: "/guru/kelas" },
        { label: "Dashboard Nilai" },
      ];
    } else if (pathname.includes("/guru/kelas/rekapitulasi-nilai/")) {
      return [
        { label: "Manajemen Kelas", href: "/guru/kelas" },
        { label: "Rekapitulasi Nilai" },
      ];
    } else if (pathname.includes("/guru/kelas/dashboard/")) {
      return [
        { label: "Manajemen Kelas", href: "/guru/kelas" },
        { label: "Dashboard Absensi" },
      ];
    } else {
      return breadcrumbMap[pathname] || [];
    }
  };

  const handleBreadcrumbClick = (
    href: string | undefined,
    e: React.MouseEvent
  ) => {
    if (!href) return;
    e.preventDefault();
    if (href === "/guru/kelas" && pathname.includes("/guru/kelas/detail")) {
      localStorage.setItem("kelas_data_refresh", "true");
    }
    router.push(href);
  };

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <SidebarProvider>
      {!hideSidebar && <AppSidebar />}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
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
                            onClick={(e) =>
                              handleBreadcrumbClick(breadcrumb.href, e)
                            }
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}