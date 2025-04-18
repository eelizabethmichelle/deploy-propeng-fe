"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import Image from 'next/image';

import type * as React from "react"
import {
  Newspaper,
  AudioWaveform,
  BookCheck,
  BookOpen,
  Bot,
  CalculatorIcon,
  Circle,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  PlusCircle,
  School,
  Settings2,
  SquareDivide,
  SquareTerminal,
  User,
} from "lucide-react"

import { NavMain } from "@/components/ui/sidebar/nav-main"
import { NavProjects } from "@/components/ui/sidebar/nav-projects"
import { NavUser } from "@/components/ui/sidebar/nav-user"
import { TeamSwitcher } from "@/components/ui/sidebar/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

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

// Custom logo component
// Custom logo component (updated)
const Logo = () => (
  <div className="flex items-center justify-center">
    <Image 
      color="#ffffff"
      src="/logo.svg" 
      alt="SIMAK SMA Kristen Anglo" 
      width={50} 
      height={72} 
      className="w-auto h-auto rounded-lg"
    />
  </div>
);


// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "SMAK Anglo",
      logo: Logo,
      plan: "Sistem Manajemen Akademik",
    },
  ],
  navMain: {
    admin: [
      {
        title: "Manajemen Akun",
        url: "#",
        icon: User,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/admin/akun/",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "/admin/akun/tambah",
          }
        ],
      },
      {
        title: "Manajemen Kelas",
        url: "#",
        icon: School,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/admin/kelas/",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "/admin/kelas/tambah",
          }
        ],
      },
      {
        title: "Manajemen Mata Pelajaran",
        url: "#",
        icon: BookCheck,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/admin/mata-pelajaran",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "/admin/mata-pelajaran/tambah",
          }
        ],
      },
      {
        title: "Manajemen Linimasa",
        url: "#",
        icon: Newspaper,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/admin/linimasa",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "/admin/linimasa/tambah",
          }
        ],
      },
    ],
    teacher: [
      {
        title: "Manajemen Kelas",
        url: "/guru/kelas",
        icon: School,
        isActive: true,
        items: [
          {
            title: "Mengelola Absensi",
            url: "/guru/kelas/absensi",
          },
          {
            title: "Lihat Rekap Nilai",
            url: "/guru/kelas/rekap-nilai",
          }
        ],
      },
      {
        title: "Manajemen Mata Pelajaran",
        url: "#",
        icon: BookCheck,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/guru/mata-pelajaran/",
          }
        ],
      },
      {
        title: "Manajemen Nilai",
        url: "#",
        icon: SquareDivide,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "/guru/manajemennilai/matapelajaran",
          },
        ],
      },
    ],
    other: [
    ],
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null);
  const [user_id, setUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const router = useRouter();

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

        if (!response.ok) {
          router.push("/login")
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        console.log("Fetched profile:", data.data);
        setProfile(data.data);
      } catch (error) {
        console.error(error);
      }
  };

  useEffect(() => {
    setRole(localStorage.getItem("role") || sessionStorage.getItem("role"));
    setUserId(Number(localStorage.getItem("user_id")) || Number(sessionStorage.getItem("user_id")));
    if (user_id !== null) fetchProfile(user_id);
  }, [user_id]);
  
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={data.teams} />
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center">Loading sidebar...</div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }

  // User not authenticated or no role
  if (!user) {
    return null; // Or a fallback sidebar
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {user.role === "admin" && <NavMain items={data.navMain.admin} />}
        {user.role === "teacher" && <NavMain items={data.navMain.teacher} />}
        {user.role === "student" && <NavMain items={data.navMain.other} />}
      </SidebarContent>
      <SidebarFooter>
        {profile && <NavUser user={{ name: profile.username, email: profile.email, avatar: data.user.avatar }} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
