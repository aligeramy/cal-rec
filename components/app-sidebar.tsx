"use client"

import * as React from "react"
import {
  AudioWaveform,
  ServerCog,
  UserCog,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { User } from "@/lib/types"

// Sample navigation data
const navMainData = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: AudioWaveform,
    isActive: true,
    items: [
      {
        title: "All Transcripts",
        url: "/dashboard/transcripts",
        items: [
          {
            title: "All Transcripts",
            url: "/dashboard/transcripts",
          },
          {
            title: "New / In Progress",
            url: "/dashboard/transcripts?status=processing",
          },
          {
            title: "Failed / Errors",
            url: "/dashboard/transcripts?status=failed",
          },
        ]
      },
      {
        title: "Search",
        url: "#",
      },
    ],
  },
  {
    title: "System",
    url: "#",
    icon: ServerCog,
    items: [
      {
        title: "Processing Queue",
        url: "#",
      },
      {
        title: "Webhook Logs",
        url: "#",
      },
      {
        title: "Audio Storage",
        url: "#",
      },
    ],
  },
  {
    title: "Admin",
    url: "#",
    icon: UserCog,
    items: [
      {
        title: "Profile",
        url: "#",
      },
      {
        title: "Settings",
        url: "#",
      },
      {
        title: "Sign Out",
        url: "#",
      },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentUser: User | null;
}

export function AppSidebar({ currentUser, ...props }: AppSidebarProps) {
  // Get sidebar context to check if collapsed
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  
  // Fallback user data if currentUser is null
  const userData = currentUser ? {
    name: currentUser.name || "User",
    email: currentUser.email,
    avatar: currentUser.image || "/avatars/user.jpg",
    initials: getInitials(currentUser.name || "User"),
  } : {
    name: "Guest User",
    email: "guest@example.com",
    avatar: "/avatars/user.jpg",
    initials: "GU",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className={`py-2 ${collapsed ? 'px-0 flex justify-center items-center' : 'px-4 flex items-center'}`}>
          <AudioWaveform className={`text-primary ${collapsed ? '' : 'mr-2'}`} />
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap">NotionIQ</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Helper function to get initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
