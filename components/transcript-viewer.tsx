"use client"

import { useState, useEffect } from 'react'
import { MeetingTranscript, Word } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Mail, Send, Edit, Save, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'
import { RichTextEditor } from './rich-text-editor'

interface TranscriptViewerProps {
  transcript: MeetingTranscript
}



export default function TranscriptViewer({ transcript: initialTranscript }: TranscriptViewerProps) {
  // State for the transcript data that can be edited
  const [transcript, setTranscript] = useState(initialTranscript)
  const [displayMode, setDisplayMode] = useState<'time' | 'full'>('full')
  const [sendingToClient, setSendingToClient] = useState(false)
  const [sendingToAdmin, setSendingToAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit mode states
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript.transcript || '')
  const [editedNotes, setEditedNotes] = useState(transcript.notes || '')
  
  // Update edited content when transcript changes
  useEffect(() => {
    setEditedTranscript(transcript.transcript || '');
    setEditedNotes(transcript.notes || '');
  }, [transcript.transcript, transcript.notes]);
  
  // Use real transcript data
  const transcriptText = transcript.transcript || '';
  const transcriptJson = transcript.transcriptJson;
  const notes = transcript.notes;

  // Client and admin email from transcript data
  const clientEmail = transcript.clientEmail
  const clientName = transcript.clientName
  const adminEmail = transcript.hostEmail
  const adminName = transcript.hostName
  
  // Format transcript based on display mode
  const renderTranscript = () => {
    if (displayMode === 'full' || !transcriptJson) {
      return <div className="whitespace-pre-wrap">{transcriptText}</div>;
    }
    
    // Time mode with timestamps
    return (
      <div className="space-y-4">
        {groupWordsByTimeChunks(transcriptJson.words).map((chunk, index) => (
          <div key={index} className="flex">
            <div className="w-16 flex-shrink-0 text-muted-foreground text-xs pt-1">
              {formatTime(chunk.startTime)}
            </div>
            <div className="flex-1">
              {chunk.text}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Group words into chunks by time (every ~10 seconds)
  const groupWordsByTimeChunks = (words: Word[]) => {
    if (!words || words.length === 0) return [];
    
    const chunks: { startTime: number; text: string }[] = [];
    let currentChunk: Word[] = [];
    let lastTimestamp = words[0].start;
    
    words.forEach(word => {
      if (word.start - lastTimestamp > 10) {
        if (currentChunk.length > 0) {
          chunks.push({
            startTime: currentChunk[0].start,
            text: currentChunk.map(w => w.word).join(' ')
          });
          currentChunk = [];
        }
        lastTimestamp = word.start;
      }
      currentChunk.push(word);
    });
    
    // Add the last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        startTime: currentChunk[0].start,
        text: currentChunk.map(w => w.word).join(' ')
      });
    }
    
    return chunks;
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
        if (type === 'transcript') setIsEditingTranscript(false)
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
  
  const viewModeButtonClass = (active: boolean) => cn(
    "px-3 py-1 text-sm font-medium rounded-md",
    active 
      ? "bg-primary text-primary-foreground" 
      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  )
  
  const renderSectionHeader = (title: string, isEditing: boolean, setEditing: (editing: boolean) => void, handleSave: () => void) => (
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  <span>Save</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="h-3 w-3 mr-1" />
              <span>Cancel</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <Edit className="h-3 w-3 mr-1" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  )
  
  return (
    <div className="space-y-4">

      
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setDisplayMode('full')}
            className={viewModeButtonClass(displayMode === 'full')}
          >
            Full View
          </button>
          <button
            onClick={() => setDisplayMode('time')}
            className={viewModeButtonClass(displayMode === 'time')}
            disabled={!transcriptJson}
          >
            Time View
          </button>
        </div>
        
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => sendEmail('client')}
                  disabled={sendingToClient || !clientEmail}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md flex items-center space-x-1",
                    clientEmail 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {sendingToClient ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-1" />
                      <span>Send PDF to Client</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {clientEmail && (
                <TooltipContent>
                  <p>{clientEmail}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => sendEmail('admin')}
                  disabled={sendingToAdmin || !adminEmail}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md flex items-center space-x-1",
                    adminEmail 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {sendingToAdmin ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      <span>Send PDF to Admin</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {adminEmail && (
                <TooltipContent>
                  <p>{adminEmail}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          

        </div>
      </div>
      
      {/* Transcript Content */}
      <div className="pt-4 border-t border-border">
        {renderSectionHeader(
          "Transcript Content", 
          isEditingTranscript, 
          setIsEditingTranscript,
          () => saveEdits('transcript')
        )}
        
        {isEditingTranscript ? (
          <RichTextEditor 
            content={editedTranscript} 
            onChange={setEditedTranscript} 
            className="bg-muted"
          />
        ) : transcript.status === 'completed' ? (
          <div className="bg-muted rounded-md p-4 text-sm">
            {renderTranscript()}
          </div>
        ) : transcript.status === 'processing' ? (
          <div className="bg-muted rounded-md p-4 text-sm text-muted-foreground">
            Transcript is being processed. Please check back later.
          </div>
        ) : transcript.status === 'failed' ? (
          <div className="bg-muted rounded-md p-4 text-sm text-destructive">
            Transcript processing failed. Please contact support.
          </div>
        ) : (
          <div className="bg-muted rounded-md p-4 text-sm text-muted-foreground">
            Transcript is pending processing.
          </div>
        )}
      </div>
      
      {/* Notes Section */}
      {(notes || isEditingNotes) && (
        <div className="pt-4 border-t border-border">
          {renderSectionHeader(
            "Notes", 
            isEditingNotes, 
            setIsEditingNotes,
            () => saveEdits('notes')
          )}
          
          {isEditingNotes ? (
            <RichTextEditor 
              content={editedNotes} 
              onChange={setEditedNotes} 
              className="bg-muted"
            />
          ) : (
            <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
              {notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 