import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MeetingTranscript } from "@/lib/types";
import TranscriptViewer from "@/components/transcript-viewer";
import { Play } from "lucide-react";

export default async function TranscriptDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const transcript = await prisma.meetingTranscript.findUnique({
    where: {
      id,
    },
  }) as MeetingTranscript | null;

  if (!transcript) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Transcript Not Found</h1>
          <Link 
            href="/dashboard/transcripts" 
            className="inline-flex items-center justify-center px-4 py-2 border border-border text-sm font-medium rounded-md bg-background hover:bg-muted/50 transition-colors"
          >
            Back to Transcripts
          </Link>
        </div>
        <div className="rounded-md border p-4 mt-4">
          <p>The transcript you are looking for does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{transcript.title || "Untitled Meeting"}</h1>
        <Link 
          href="/dashboard/transcripts" 
          className="inline-flex items-center justify-center px-4 py-2 border border-border text-sm font-medium rounded-md bg-background hover:bg-muted/50 transition-colors"
        >
          Back to Transcripts
        </Link>
      </div>

      <div className="space-y-6">
        {/* Meeting Information */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Client Information */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">Client Information</h3>
              <dl className="space-y-3">
                {transcript.clientName && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.clientName}</dd>
                  </div>
                )}
                {transcript.clientEmail && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.clientEmail}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Host Information */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">Host Information</h3>
              <dl className="space-y-3">
                {transcript.hostName && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Name</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.hostName}</dd>
                  </div>
                )}
                {transcript.hostEmail && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.hostEmail}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Meeting Details */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">Meeting Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Booking ID</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.bookingUid}</dd>
                </div>
                {transcript.meetingType && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Meeting Type</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.meetingType}</dd>
                  </div>
                )}
                {transcript.duration && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Duration</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{transcript.duration} minutes</dd>
                  </div>
                )}
                {transcript.location && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                      {transcript.location.startsWith('http') ? (
                        <a href={transcript.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                          View Meeting
                        </a>
                      ) : (
                        transcript.location
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
        
        {/* Time and Status Information */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Time Information */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">Time Information</h3>
              <dl className="space-y-3">
                {transcript.startTime && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Start Time</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatDate(transcript.startTime)}</dd>
                  </div>
                )}
                {transcript.endTime && (
                  <div>
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">End Time</dt>
                    <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatDate(transcript.endTime)}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Status Information */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">Status Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                      ${transcript.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        transcript.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        transcript.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`
                    }>
                      {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Created</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatDate(transcript.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Updated</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 mt-1">{formatDate(transcript.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Recording Section */}
        {transcript.recordingUrl && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Recording</h3>
              <a 
                href={transcript.recordingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Play className="h-4 w-4" />
                View Recording
              </a>
            </div>
          </div>
        )}
        
        {/* Transcript and Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <TranscriptViewer transcript={transcript} />
        </div>
      </div>
    </div>
  );
} 