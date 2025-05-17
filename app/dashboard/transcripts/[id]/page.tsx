import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MeetingTranscript } from "@/lib/types";

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function TranscriptDetailPage({ params }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const transcript = await prisma.meetingTranscript.findUnique({
    where: {
      id: params.id,
    },
  }) as MeetingTranscript | null;

  if (!transcript) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Transcript Not Found</h1>
          <Link 
            href="/dashboard/transcripts" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
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
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          Back to Transcripts
        </Link>
      </div>

      <div className="rounded-md border p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Attendee Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Client Information</h3>
            <dl className="mt-2 space-y-2">
              {transcript.clientName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{transcript.clientName}</dd>
                </div>
              )}
              {transcript.clientEmail && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{transcript.clientEmail}</dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Host Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Host Information</h3>
            <dl className="mt-2 space-y-2">
              {transcript.hostName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{transcript.hostName}</dd>
                </div>
              )}
              {transcript.hostEmail && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{transcript.hostEmail}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Meeting Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Meeting Details</h3>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
                <dd className="text-sm text-gray-900">{transcript.bookingUid}</dd>
              </div>
              {transcript.meetingType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Meeting Type</dt>
                  <dd className="text-sm text-gray-900">{transcript.meetingType}</dd>
                </div>
              )}
              {transcript.duration && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">{transcript.duration} minutes</dd>
                </div>
              )}
              {transcript.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">
                    {transcript.location.startsWith('http') ? (
                      <a href={transcript.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {transcript.location}
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
        
        {/* Time Information */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Time Information</h3>
            <dl className="mt-2 space-y-2">
              {transcript.startTime && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                  <dd className="text-sm text-gray-900">{formatDate(transcript.startTime)}</dd>
                </div>
              )}
              {transcript.endTime && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Time</dt>
                  <dd className="text-sm text-gray-900">{formatDate(transcript.endTime)}</dd>
                </div>
              )}
            </dl>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status Information</h3>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                    ${transcript.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transcript.status === 'failed' ? 'bg-red-100 text-red-800' :
                      transcript.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`
                  }>
                    {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{formatDate(transcript.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(transcript.updatedAt)}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            {transcript.recordingUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Recording</h3>
                <div className="mt-2">
                  <a 
                    href={transcript.recordingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View Recording
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes Section */}
        {transcript.notes && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <div className="bg-gray-50 rounded-md p-4 text-sm whitespace-pre-wrap">
              {transcript.notes}
            </div>
          </div>
        )}

        {/* Transcript Content */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Transcript Content</h3>
          {transcript.status === 'completed' && transcript.transcript ? (
            <div className="bg-gray-50 rounded-md p-4 text-sm whitespace-pre-wrap">
              {transcript.transcript}
            </div>
          ) : transcript.status === 'processing' ? (
            <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-500">
              Transcript is being processed. Please check back later.
            </div>
          ) : transcript.status === 'failed' ? (
            <div className="bg-gray-50 rounded-md p-4 text-sm text-red-500">
              Transcript processing failed. Please contact support.
            </div>
          ) : (
            <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-500">
              Transcript is pending processing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 