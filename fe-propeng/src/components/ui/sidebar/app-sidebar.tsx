"use client";

import { useEffect, useState } from "react";


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


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {role === "admin" && <NavMain items={data.navMain.admin} />}
        {role === "teacher" && <NavMain items={data.navMain.teacher} />}
        {role === "other" && <NavMain items={data.navMain.other} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

