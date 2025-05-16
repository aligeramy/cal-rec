"use client"

import * as React from "react"
import {
  AudioWaveform,
  ServerCog,
  UserCog,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
        title: "Transcripts",
        url: "#",
        items: [
          {
            title: "All Transcripts",
            url: "#",
          },
          {
            title: "New / In Progress",
            url: "#",
          },
          {
            title: "Failed / Errors",
            url: "#",
          },
        ]
      },
      {
        title: "Search",
        url: "#",
      },
      {
        title: "Bookings",
        url: "#",
      }
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
  // Fallback user data if currentUser is null
  const userData = currentUser ? {
    name: currentUser.name || "User",
    email: currentUser.email,
    avatar: currentUser.image || "/avatars/user.jpg",
  } : {
    name: "Guest User",
    email: "guest@example.com",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-2 px-4 flex items-center">
          <AudioWaveform className="text-primary mr-2" />
          <span className="font-bold text-lg">TranscriptAI</span>
        </div>
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
