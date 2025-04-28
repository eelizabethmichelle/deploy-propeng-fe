"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const hideSidebar = false

  // Breadcrumb maps for student routes
  const breadcrumbMap: { [key: string]: { label: string; href?: string }[] } = {
    "/siswa/laporannilaiabsen": [{ label: "Laporan Nilai dan Kehadiran Siswa" }],
    "/siswa/mata-pelajaran-peminatan": [{ label: "Pengajuan Mata Pelajaran Peminatan" }],
    "/siswa/mata-pelajaran-peminatan/daftar": [
      { label: "Pengajuan Mata Pelajaran Peminatan", href: "/siswa/mata-pelajaran-peminatan" },
      { label: "Daftar" },
    ],
  }

  // Generate breadcrumbs based on current pathname
  const generateBreadcrumbs = (pathname: string): { label: string; href?: string }[] => {
    // Handle dynamic routes
    if (pathname.match(/^\/siswa\/laporannilai\/[^/]+$/)) {
      return [
        { label: "Laporan Nilai dan Kehadiran Siswa", href: "/siswa/laporannilaiabsen" },
        { label: "Detail Nilai Siswa" },
      ]
    } else {
      return breadcrumbMap[pathname] || []
    }
  }

  const handleBreadcrumbClick = (href: string | undefined, e: React.MouseEvent) => {
    if (!href) return
    e.preventDefault()
    router.push(href)
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
