import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MeetingTranscript } from "@/lib/types";

type Props = {
  params: Record<string, never>;
  searchParams: { status?: string };
};

export default async function TranscriptsPage({ searchParams }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Get the status filter from search params if it exists
  const statusFilter = searchParams?.status;

  // Build the where clause based on status filter
  const where = statusFilter ? { status: statusFilter } : {};

  const transcripts = await prisma.meetingTranscript.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  }) as MeetingTranscript[];

  const statusCounts = await prisma.meetingTranscript.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  // Create a map of status to count
  const counts = statusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {statusFilter 
            ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Transcripts` 
            : "All Transcripts"}
        </h1>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex mb-4">
        <Link
          href="/dashboard/transcripts"
          className={`px-4 py-2 text-sm rounded-l-md ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All ({(counts['completed'] || 0) + (counts['pending'] || 0) + (counts['processing'] || 0) + (counts['failed'] || 0)})
        </Link>
        <Link
          href="/dashboard/transcripts?status=processing"
          className={`px-4 py-2 text-sm ${statusFilter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Processing ({counts['processing'] || 0})
        </Link>
        <Link
          href="/dashboard/transcripts?status=completed"
          className={`px-4 py-2 text-sm ${statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Completed ({counts['completed'] || 0})
        </Link>
        <Link
          href="/dashboard/transcripts?status=failed"
          className={`px-4 py-2 text-sm rounded-r-md ${statusFilter === 'failed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Failed ({counts['failed'] || 0})
        </Link>
      </div>

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Client</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Start Time</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Duration</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {transcripts.length === 0 ? (
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No transcripts found
                  </td>
                </tr>
              ) : (
                transcripts.map((transcript) => (
                  <tr 
                    key={transcript.id} 
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{transcript.title || "Untitled"}</td>
                    <td className="p-4 align-middle">
                      {transcript.clientName || "Unknown"}
                      {transcript.clientEmail && (
                        <div className="text-xs text-gray-500 mt-0.5">{transcript.clientEmail}</div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {transcript.startTime ? formatDate(transcript.startTime) : "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      {transcript.duration ? `${transcript.duration} minutes` : "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${transcript.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transcript.status === 'failed' ? 'bg-red-100 text-red-800' :
                          transcript.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`
                      }>
                        {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right align-middle">
                      <Link 
                        href={`/dashboard/transcripts/${transcript.id}`}
                        className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 