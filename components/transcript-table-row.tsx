"use client"

import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MeetingTranscript } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface TranscriptTableRowProps {
  transcript: MeetingTranscript
}

const TranscriptTableRow: FC<TranscriptTableRowProps> = ({ transcript }) => {
  const router = useRouter()

  const handleRowClick = () => {
    router.push(`/dashboard/transcripts/${transcript.id}`)
  }

  return (
    <tr 
      key={transcript.id} 
      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
      onClick={handleRowClick}
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
          onClick={(e) => e.stopPropagation()}
        >
          View
        </Link>
      </td>
    </tr>
  )
}

export default TranscriptTableRow 