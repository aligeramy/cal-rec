import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" currentUser={currentUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 