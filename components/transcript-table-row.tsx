"use client"

import { FC, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MeetingTranscript } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Archive, ArchiveRestore, Loader2, RotateCcw } from 'lucide-react'

interface TranscriptTableRowProps {
  transcript: MeetingTranscript
  isArchived?: boolean
}

const TranscriptTableRow: FC<TranscriptTableRowProps> = ({ transcript, isArchived = false }) => {
  const router = useRouter()
  const [isArchiving, setIsArchiving] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRowClick = () => {
    router.push(`/dashboard/transcripts/${transcript.id}`)
  }

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsArchiving(true)

    try {
      const response = await fetch('/api/transcripts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: transcript.id,
          meetingType: isArchived ? null : 'archived',
        }),
      })

      if (response.ok) {
        toast.success(isArchived ? 'Transcript unarchived successfully' : 'Transcript archived successfully')
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update transcript')
      }
    } catch (error) {
      console.error('Error updating transcript:', error)
      toast.error(`Failed to ${isArchived ? 'unarchive' : 'archive'} transcript: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsArchiving(false)
    }
  }

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRetrying(true)

    try {
      const response = await fetch('/api/transcripts/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          transcriptId: transcript.id,
        }),
      })

      if (response.ok) {
        toast.success('Transcript retry started successfully')
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to retry transcript')
      }
    } catch (error) {
      console.error('Error retrying transcript:', error)
      toast.error(`Failed to retry transcript: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <tr 
      key={transcript.id} 
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="p-4 align-middle">
        <div className="flex items-center space-x-2">
          <span>{transcript.title || "Untitled"}</span>
          {isArchived && (
            <Archive className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="p-4 align-middle">
        {transcript.clientName || "Unknown"}
        {transcript.clientEmail && (
          <div className="text-xs text-muted-foreground mt-0.5">{transcript.clientEmail}</div>
        )}
      </td>
      <td className="p-4 align-middle">
        {transcript.startTime ? formatDate(transcript.startTime) : "N/A"}
      </td>
      <td className="p-4 align-middle">
        {transcript.duration ? `${transcript.duration} minutes` : "N/A"}
      </td>
      <td className="p-4 align-middle">
        {isArchived ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
            Archived
          </span>
        ) : (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
            ${transcript.status === 'completed' ? 'bg-green-100 text-green-800' :
              transcript.status === 'failed' ? 'bg-red-100 text-red-800' :
              transcript.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'}`
          }>
            {transcript.status.charAt(0).toUpperCase() + transcript.status.slice(1)}
          </span>
        )}
      </td>
      <td className="p-4 text-right align-middle">
        <div className="flex items-center justify-end space-x-2">
          <Link 
            href={`/dashboard/transcripts/${transcript.id}`}
            className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
          
          {/* Retry button for failed transcripts */}
          {transcript.status === 'failed' && !isArchived && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/50 text-orange-600 hover:text-orange-700 transition-colors"
              title="Retry transcript processing"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </button>
          )}
          
          <button
            onClick={handleArchiveToggle}
            disabled={isArchiving}
            className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isArchived 
                ? 'border border-border bg-background hover:bg-muted/50 text-foreground'
                : 'border border-border bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            }`}
            title={isArchived ? 'Unarchive transcript' : 'Archive transcript'}
          >
            {isArchiving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isArchived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default TranscriptTableRow 