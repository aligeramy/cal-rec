"use client"

import { useRouter } from 'next/navigation'
import AIConversationGenerator from './ai-conversation-generator'

export default function TranscriptsPageClient() {
  const router = useRouter()

  return (
    <AIConversationGenerator 
      onConversationGenerated={() => {
        // Refresh the page to show the new conversation
        router.refresh()
      }}
    />
  )
} 