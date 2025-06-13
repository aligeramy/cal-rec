"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import TranscriptsPageClient from "@/components/transcripts-page-client"
import Link from "next/link"
import { FileText } from "lucide-react"
import { Suspense } from "react"

function HeaderContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Dashboard page
  if (pathname === '/dashboard') {
    return (
      <SiteHeader 
        title="Dashboard"
        actions={
          <Link 
            href="/dashboard/transcripts" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            View All Transcripts
          </Link>
        }
      />
    )
  }
  
  // Transcripts pages
  if (pathname.startsWith('/dashboard/transcripts')) {
    const status = searchParams.get('status')
    const view = searchParams.get('view')
    
    let title = "Meeting Transcripts"
    if (view === 'archived') {
      title = 'Archived Transcripts'
    } else if (status) {
      title = `${status.charAt(0).toUpperCase() + status.slice(1)} Transcripts`
    }
    
    return (
      <SiteHeader 
        title={title}
        actions={<TranscriptsPageClient />}
      />
    )
  }
  
  // Default header (no title/actions)
  return <SiteHeader />
}

export function DynamicHeader() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <HeaderContent />
    </Suspense>
  )
} 