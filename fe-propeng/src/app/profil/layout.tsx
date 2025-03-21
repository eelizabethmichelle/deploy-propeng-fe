"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import ProfilePageStudent from "./@student/page";
import ProfilePageTeacher from "./@teacher/page";
import ProfilePageAdmin from "./@admin/page";
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

interface TokenPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;
}

interface ProfileData {
  user_id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  nisp: string;
  angkatan: number;
  isActive: boolean;
}

export default function ProfileLayout({
  admin,
  student,
  teacher,
}: {
  admin: React.ReactNode;
  student: React.ReactNode;
  teacher: React.ReactNode;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!token) {
      console.log("Token tidak ditemukan, redirect ke /login");
      router.push("/login");
      return;
    }

    try {
      const decoded: TokenPayload = jwtDecode<TokenPayload>(token);
      console.log("Decoded JWT:", decoded);

      if (Date.now() >= decoded.exp * 1000) {
        console.error("Token expired, redirect ke /login");
        router.push("/login");
        return;
      }

      setRole(decoded.role);
      fetchProfile(decoded.user_id);
    } catch (error) {
      console.error("Invalid token, redirect ke /login", error);
      router.push("/login");
    }
  }, []);

  const fetchProfile = async (userId: number) => {
    try {
      const accessToken =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch(`/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken} Id ${userId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      console.log("Fetched profile:", data.data);
      setProfile(data.data);
    } catch (error) {
      console.error(error);
      router.push("/login");
    }
  };

  if (!role || !profile) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Render the appropriate profile component based on user role
  const renderProfileContent = () => {
    switch (role) {
      case "admin":
        return <ProfilePageAdmin user_id={profile?.user_id} />;
      case "student":
        return <ProfilePageStudent user_id={profile?.user_id} />;
      case "teacher":
        return <ProfilePageTeacher user_id={profile?.user_id} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Profil</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0" style={{ backgroundColor: "#fdfdff" }}>
          {renderProfileContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
