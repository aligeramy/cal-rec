"use client"

import { useState, useEffect } from 'react'
import { MeetingTranscript, TranscriptJson } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Mail, Send, Edit, Save, X, Sparkles } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'

interface TranscriptViewerProps {
  transcript: MeetingTranscript
}

export default function TranscriptViewer({ transcript: initialTranscript }: TranscriptViewerProps) {
  // State for the transcript data that can be edited
  const [transcript, setTranscript] = useState<MeetingTranscript>(initialTranscript)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript.transcript || '')
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'full' | 'speaker'>('full')
  const [sendingToClient, setSendingToClient] = useState(false)
  const [sendingToAdmin, setSendingToAdmin] = useState(false)
  
  // Edit mode states
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState(transcript.notes || '')
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  
  // Update edited content when transcript changes
  useEffect(() => {
    setEditedTranscript(transcript.transcript || '');
    setEditedNotes(transcript.notes || '');
  }, [transcript.transcript, transcript.notes]);
  
  // Use real transcript data
  const transcriptText = transcript.transcript || 'No transcript available'

  // Debug: Log the transcriptJson to see its structure
  useEffect(() => {
    console.log('🔍 Debug transcriptJson:', {
      raw: transcript.transcriptJson,
      type: typeof transcript.transcriptJson,
      hasUtterances: transcript.transcriptJson?.utterances,
      utterancesLength: transcript.transcriptJson?.utterances?.length
    });
  }, [transcript.transcriptJson]);

  // Parse transcriptJson if it's a string
  let parsedTranscriptJson: TranscriptJson | null = null
  if (transcript.transcriptJson) {
    try {
      if (typeof transcript.transcriptJson === 'string') {
        parsedTranscriptJson = JSON.parse(transcript.transcriptJson)
      } else {
        parsedTranscriptJson = transcript.transcriptJson as TranscriptJson
      }
    } catch (error) {
      console.error('Failed to parse transcriptJson:', error)
    }
  }

  // Client and admin email from transcript data
  const clientEmail = transcript.clientEmail
  const clientName = transcript.clientName
  const adminEmail = transcript.hostEmail
  const adminName = transcript.hostName
  
  // Get speaker name for display
  const getSpeakerName = (speakerId: number) => {
    if (speakerId === 0) {
      return transcript.clientName || 'Client'
    } else if (speakerId === 1) {
      return transcript.hostName || 'Host'
    } else {
      return `Speaker ${speakerId + 1}`
    }
  }

  // Format transcript based on display mode
  const renderTranscript = () => {
    if (viewMode === 'full' || !parsedTranscriptJson?.utterances) {
      // Full view - simple text display
      return (
        <div className="whitespace-pre-wrap leading-relaxed text-sm max-h-96 overflow-y-auto pr-2">
          {transcriptText}
        </div>
      );
    } else {
      // Speaker view - chat-like interface
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {parsedTranscriptJson.utterances.map((utterance, index) => {
            const isClient = utterance.speaker === 0;
            const speakerName = getSpeakerName(utterance.speaker);
            const timestamp = formatTime(utterance.start);
            
            return (
              <div key={index} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isClient ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <Badge variant="outline" className="text-xs">
                      {speakerName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {timestamp}
                    </span>
                    {utterance.confidence < 0.8 && (
                      <Badge variant="secondary" className="text-xs">
                        Low confidence
                      </Badge>
                    )}
                  </div>
                  <div className={`rounded-lg px-4 py-2 ${
                    isClient 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted mr-auto'
                  }`}>
                    <p className="text-sm leading-relaxed">
                      {utterance.transcript}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  // Save edited transcript or notes to the database
  const saveEdits = async (type: 'transcript' | 'notes') => {
    
    setIsSaving(true)
    
    try {
      const dataToUpdate = {
        id: transcript.id,
        ...(type === 'transcript' && { transcript: editedTranscript }),
        ...(type === 'notes' && { notes: editedNotes }),
      }
      
      const response = await fetch('/api/transcripts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToUpdate),
      })
      
      if (response.ok) {
        setTranscript(prevState => ({
          ...prevState,
          ...(type === 'transcript' && { transcript: editedTranscript }),
          ...(type === 'notes' && { notes: editedNotes }),
        }))
        
        toast.success(`${type === 'transcript' ? 'Transcript' : 'Notes'} updated successfully`)
        
        // Exit edit mode
        if (type === 'transcript') setIsEditing(false)
        if (type === 'notes') setIsEditingNotes(false)
      } else {
        const error = await response.json()
        throw new Error(error.message || `Failed to update ${type}`)
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error)
      toast.error(`Failed to save ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Send email to client or admin
  const sendEmail = async (recipient: 'client' | 'admin') => {
    const isClient = recipient === 'client'
    const setLoading = isClient ? setSendingToClient : setSendingToAdmin
    const email = isClient ? clientEmail : adminEmail
    const name = isClient ? clientName : adminName
    
    if (!email) {
      toast.error(`No email address found for ${recipient}`)
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/transcripts/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          transcriptId: transcript.id,
          recipient: {
            email,
            name: name || email.split('@')[0]
          },
          subject: `Meeting Transcript: ${transcript.title || 'Untitled Meeting'}`,
          includeNotes: true,
          includeTranscript: true,
          sendAsPDF: true
        }),
      })
      
      if (response.ok) {
        toast.success(`Transcript sent to ${isClient ? 'client' : 'admin'} successfully`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Generate AI notes based on transcript
  const generateAINotes = async () => {
    if (!transcript.transcript || transcript.transcript.trim().length === 0) {
      toast.error('No transcript content available to generate notes from')
      return
    }
    
    setIsGeneratingNotes(true)
    
    try {
      const response = await fetch('/api/transcripts/generate-notes', {
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
        const result = await response.json()
        setEditedNotes(result.notes)
        toast.success('AI notes generated successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate AI notes')
      }
    } catch (error) {
      console.error('Error generating AI notes:', error)
      toast.error(`Failed to generate AI notes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingNotes(false)
    }
  }
  
  const viewModeButtonClass = (active: boolean) => cn(
    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
    active 
      ? "bg-primary text-primary-foreground shadow-sm" 
      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  )
  
  const renderSectionHeader = (title: string, isEditing: boolean, setEditing: (editing: boolean) => void, handleSave: () => void, showAIButton?: boolean) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex space-x-2">
        {/* AI Generate button for notes when editing */}
        {showAIButton && isEditing && (
          <button
            onClick={generateAINotes}
            disabled={isGeneratingNotes}
            className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isGeneratingNotes ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {isGeneratingNotes ? 'Generating...' : 'Generate AI Notes'}
          </button>
        )}
        
        {/* Edit button */}
        {!isEditing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('full')}
            className={viewModeButtonClass(viewMode === 'full')}
          >
            Full View
          </button>
          <button
            onClick={() => setViewMode('speaker')}
            className={viewModeButtonClass(viewMode === 'speaker')}
            disabled={!parsedTranscriptJson?.utterances}
          >
            Speaker View
          </button>
        </div>
        
        {/* Send PDF Buttons */}
        <div className="flex space-x-2">
          {clientEmail && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => sendEmail('client')}
                    disabled={sendingToClient}
                    className="inline-flex items-center text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingToClient ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send PDF to Client
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send transcript PDF to {clientName || clientEmail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {adminEmail && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => sendEmail('admin')}
                    disabled={sendingToAdmin}
                    className="inline-flex items-center text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {sendingToAdmin ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send PDF to Admin
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send transcript PDF to {adminName || adminEmail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {/* Transcript Content */}
      <div className="border-t border-border pt-6">
        {renderSectionHeader(
          "Transcript Content", 
          isEditing, 
          setIsEditing,
          () => saveEdits('transcript'),
          false
        )}
        
        {isEditing ? (
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="w-full min-h-[300px] p-4 bg-muted rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter transcript text..."
          />
        ) : transcript.status === 'completed' ? (
          <div className="bg-muted/50 rounded-lg p-6 text-sm border">
            {renderTranscript()}
          </div>
        ) : transcript.status === 'processing' ? (
          <div className="bg-muted/50 rounded-lg p-6 text-sm text-muted-foreground border flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Transcript is being processed. Please check back later.</span>
            </div>
          </div>
        ) : transcript.status === 'failed' ? (
          <div className="bg-destructive/10 rounded-lg p-6 text-sm text-destructive border border-destructive/20">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Transcript processing failed.</span>
              <span>Please contact support.</span>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-6 text-sm text-muted-foreground border">
            Transcript is pending processing.
          </div>
        )}
      </div>
      
      {/* Notes Section */}
      {(transcript.notes || isEditingNotes || (!transcript.notes && !isEditingNotes)) && (
        <div className="border-t border-border pt-6">
          {renderSectionHeader(
            "Meeting Notes", 
            isEditingNotes, 
            setIsEditingNotes,
            () => saveEdits('notes'),
            true
          )}
          
          {isEditingNotes ? (
            <div className="space-y-3">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full min-h-[200px] p-4 bg-muted rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter meeting notes or click 'Generate AI Notes' to create notes automatically from the transcript..."
              />
              {!transcript.notes && !editedNotes && (
                <p className="text-sm text-muted-foreground">
                  💡 Tip: Click &quot;Generate AI Notes&quot; to automatically create professional meeting notes based on the transcript content.
                </p>
              )}
            </div>
          ) : transcript.notes ? (
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap border">
              {transcript.notes}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border text-center">
              <p>No meeting notes available.</p>
              <p className="mt-2">
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-primary hover:underline"
                >
                  Click here to add notes
                </button> or generate them automatically using AI.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 