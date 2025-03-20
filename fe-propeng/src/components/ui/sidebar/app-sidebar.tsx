"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';


import type * as React from "react"
import {
  AudioWaveform,
  BookCheck,
  BookOpen,
  Bot,
  Circle,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  PlusCircle,
  School,
  Settings2,
  SquareTerminal,
  User,
} from "lucide-react"

import { NavMain } from "@/components/ui/sidebar/nav-main"
import { NavProjects } from "@/components/ui/sidebar/nav-projects"
import { NavUser } from "@/components/ui/sidebar/nav-user"
import { TeamSwitcher } from "@/components/ui/sidebar/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
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
            url: "/admin/kelas/lihat-kelas",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "/admin/kelas/tambah-kelas",
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
    ],
    teacher: [
      {
        title: "Manajemen Kelas",
        url: "#",
        icon: School,
        isActive: true,
        items: [
          {
            title: "Lihat Semua",
            url: "#",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "#",
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
            url: "#",
          },
          {
            title: "Tambah",
            icon: PlusCircle,
            url: "#",
          }
        ],
      },
    ],
    other: [
    ],
  },

  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role") || sessionStorage.getItem("role"));
  }, []);

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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

