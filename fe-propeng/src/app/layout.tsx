"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from '@/context/AuthContext';
import "./globals.css";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { usePathname, useRouter } from "next/navigation";

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

  // Determine breadcrumbs based on pathname
  let breadcrumbs: ({ label: string; href: string; current?: undefined; } | { label: string; current: boolean; href?: undefined; })[] = [];

  if (pathname.includes("/profil/@admin")) {
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
  } else if (pathname === "/profil") {
    breadcrumbs = [
      { label: "Profil", current: true },
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
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                {/* Use the new AppBreadcrumb component */}
                <AppBreadcrumb items={breadcrumbs} />
              </div>
            </header>
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}