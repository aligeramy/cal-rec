import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MeetingTranscript } from "@/lib/types";
import TranscriptTableRow from "@/components/transcript-table-row";
import TranscriptsPageClient from "@/components/transcripts-page-client";
import { Badge } from "@/components/ui/badge";
import { Archive, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function TranscriptsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string; view?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Get the status filter and view from search params
  const statusFilter = resolvedSearchParams?.status;
  const viewFilter = resolvedSearchParams?.view;

  // Build the where clause based on filters
  const buildWhereClause = () => {
    if (viewFilter === 'archived') {
      return { meetingType: 'archived' };
    } else {
      const baseWhere: { meetingType: { not: string }; status?: string } = {
        meetingType: { not: 'archived' }
      };
      
      if (statusFilter) {
        baseWhere.status = statusFilter;
      }
      
      return baseWhere;
    }
  };
  
  const where = buildWhereClause();

  const transcripts = await prisma.meetingTranscript.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  }) as MeetingTranscript[];

  // Get counts for all transcripts (excluding archived)
  const statusCounts = await prisma.meetingTranscript.groupBy({
    by: ['status'],
    where: { meetingType: { not: 'archived' } },
    _count: {
      status: true
    }
  });

  // Get archived count
  const archivedCount = await prisma.meetingTranscript.count({
    where: { meetingType: 'archived' }
  });

  // Create a map of status to count
  const counts = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const totalActive = (counts['completed'] || 0) + (counts['pending'] || 0) + (counts['processing'] || 0) + (counts['failed'] || 0);

  const getTabClass = (isActive: boolean) => {
    return `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-primary text-primary-foreground shadow-sm' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {viewFilter === 'archived' 
              ? 'Archived Transcripts'
              : statusFilter 
                ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Transcripts` 
                : "Meeting Transcripts"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewFilter === 'archived' 
              ? 'View and manage your archived meeting transcripts'
              : 'Manage your meeting transcripts and recordings'}
          </p>
        </div>
        <div className="flex space-x-3">
          <TranscriptsPageClient />
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Professional Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-1 pb-4" aria-label="Tabs">
          <Link
            href="/dashboard/transcripts"
            className={getTabClass(!statusFilter && viewFilter !== 'archived')}
          >
            <FileText className="h-4 w-4" />
            All Transcripts
            <Badge variant="secondary" className="ml-1">
              {totalActive}
            </Badge>
          </Link>
          
          <Link
            href="/dashboard/transcripts?status=processing"
            className={getTabClass(statusFilter === 'processing')}
          >
            {getStatusIcon('processing')}
            Processing
            <Badge variant="secondary" className="ml-1">
              {counts['processing'] || 0}
            </Badge>
          </Link>
          
          <Link
            href="/dashboard/transcripts?status=completed"
            className={getTabClass(statusFilter === 'completed')}
          >
            {getStatusIcon('completed')}
            Completed
            <Badge variant="secondary" className="ml-1">
              {counts['completed'] || 0}
            </Badge>
          </Link>
          
          <Link
            href="/dashboard/transcripts?status=failed"
            className={getTabClass(statusFilter === 'failed')}
          >
            {getStatusIcon('failed')}
            Failed
            <Badge variant="secondary" className="ml-1">
              {counts['failed'] || 0}
            </Badge>
          </Link>
          
          <Link
            href="/dashboard/transcripts?view=archived"
            className={getTabClass(viewFilter === 'archived')}
          >
            <Archive className="h-4 w-4" />
            Archived
            <Badge variant="secondary" className="ml-1">
              {archivedCount}
            </Badge>
          </Link>
        </nav>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Start Time</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {transcripts.length === 0 ? (
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      {viewFilter === 'archived' ? (
                        <>
                          <Archive className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No archived transcripts found</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {statusFilter 
                              ? `No ${statusFilter} transcripts found`
                              : 'No transcripts found'
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transcripts.map((transcript) => (
                  <TranscriptTableRow 
                    key={transcript.id} 
                    transcript={transcript} 
                    isArchived={viewFilter === 'archived'}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 