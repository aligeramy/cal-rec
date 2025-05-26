"use client"

import { useState, useEffect } from 'react'
import { MeetingTranscript, Word, TranscriptJson } from '@/lib/types'
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

// Sample OpenAI Whisper format JSON data that we'll use for demo mode
const DEMO_TRANSCRIPT_JSON: TranscriptJson = {
  words: [
    { word: "Hi", start: 0.5, end: 0.8, confidence: 0.97 },
    { word: "there,", start: 0.9, end: 1.2, confidence: 0.98 },
    { word: "I", start: 1.3, end: 1.6, confidence: 0.98 },
    { word: "heard", start: 1.7, end: 2.0, confidence: 0.97 },
    { word: "you", start: 2.1, end: 2.4, confidence: 0.98 },
    { word: "have", start: 2.5, end: 2.8, confidence: 0.98 },
    { word: "Narcan", start: 2.9, end: 3.2, confidence: 0.97 },
    { word: "kits", start: 3.3, end: 3.6, confidence: 0.98 },
    { word: "available.", start: 3.7, end: 4.0, confidence: 0.97 },
    { word: "Could", start: 4.1, end: 4.4, confidence: 0.99 },
    { word: "I", start: 4.5, end: 4.8, confidence: 0.97 },
    { word: "get", start: 4.9, end: 5.2, confidence: 0.97 },
    { word: "one?", start: 5.3, end: 5.6, confidence: 0.98 },
    { word: "Absolutely.", start: 5.9, end: 6.3, confidence: 0.98 },
    { word: "Are", start: 6.4, end: 6.7, confidence: 0.99 },
    { word: "you", start: 6.8, end: 7.1, confidence: 0.98 },
    { word: "looking", start: 7.2, end: 7.6, confidence: 0.98 },
    { word: "for", start: 7.7, end: 7.8, confidence: 0.99 },
    { word: "the", start: 7.9, end: 8.0, confidence: 0.98 },
    { word: "nasal", start: 8.1, end: 8.4, confidence: 0.99 },
    { word: "spray", start: 8.5, end: 8.8, confidence: 0.97 },
    { word: "kit?", start: 8.9, end: 9.2, confidence: 0.97 },
    { word: "Yes,", start: 9.5, end: 9.8, confidence: 0.99 },
    { word: "the", start: 9.9, end: 10.0, confidence: 0.98 },
    { word: "nasal", start: 10.1, end: 10.4, confidence: 0.99 },
    { word: "spray.", start: 10.5, end: 10.9, confidence: 0.98 },
    { word: "It's", start: 11.0, end: 11.2, confidence: 0.98 },
    { word: "for", start: 11.3, end: 11.4, confidence: 0.99 },
    { word: "my", start: 11.5, end: 11.6, confidence: 0.97 },
    { word: "brother;", start: 11.7, end: 12.1, confidence: 0.80 },
    { word: "he", start: 12.2, end: 12.3, confidence: 0.98 },
    { word: "recently", start: 12.4, end: 12.8, confidence: 0.97 },
    { word: "started", start: 12.9, end: 13.2, confidence: 0.98 },
    { word: "new", start: 13.3, end: 13.5, confidence: 0.98 },
    { word: "meds", start: 13.6, end: 13.9, confidence: 0.97 },
    { word: "and", start: 14.0, end: 14.1, confidence: 0.99 },
    { word: "I'm", start: 14.2, end: 14.4, confidence: 0.97 },
    { word: "worried.", start: 14.5, end: 14.9, confidence: 0.97 },
    { word: "Understood.", start: 15.3, end: 15.7, confidence: 0.98 },
    { word: "The", start: 15.8, end: 15.9, confidence: 0.99 },
    { word: "kit", start: 16.0, end: 16.2, confidence: 0.98 },
    { word: "is", start: 16.3, end: 16.4, confidence: 0.99 },
    { word: "free,", start: 16.5, end: 16.8, confidence: 0.97 },
    { word: "we'll", start: 16.9, end: 17.1, confidence: 0.98 },
    { word: "just", start: 17.2, end: 17.4, confidence: 0.98 },
    { word: "need", start: 17.5, end: 17.7, confidence: 0.97 },
    { word: "your", start: 17.8, end: 18.0, confidence: 0.99 },
    { word: "postal", start: 18.1, end: 18.4, confidence: 0.98 },
    { word: "code", start: 18.5, end: 18.7, confidence: 0.97 },
    { word: "for", start: 18.8, end: 18.9, confidence: 0.99 },
    { word: "stats.", start: 19.0, end: 19.3, confidence: 0.80 },
    { word: "Sure,", start: 19.6, end: 19.9, confidence: 0.98 },
    { word: "it's", start: 20.0, end: 20.2, confidence: 0.97 },
    { word: "M5V", start: 20.3, end: 20.6, confidence: 0.97 },
    { word: "2T6.", start: 20.7, end: 21.0, confidence: 0.99 },
    { word: "Thanks.", start: 21.3, end: 21.6, confidence: 0.98 },
    { word: "Have", start: 21.7, end: 21.9, confidence: 0.98 },
    { word: "you", start: 22.0, end: 22.2, confidence: 0.97 },
    { word: "used", start: 22.3, end: 22.6, confidence: 0.97 },
    { word: "Narcan", start: 22.7, end: 23.0, confidence: 0.98 },
    { word: "before?", start: 23.1, end: 23.4, confidence: 0.97 },
    { word: "No,", start: 23.7, end: 24.0, confidence: 0.99 },
    { word: "never.", start: 24.1, end: 24.4, confidence: 0.97 },
    { word: "I'll", start: 24.7, end: 25.0, confidence: 0.98 },
    { word: "give", start: 25.1, end: 25.3, confidence: 0.97 },
    { word: "you", start: 25.4, end: 25.6, confidence: 0.97 },
    { word: "quick", start: 25.7, end: 26.0, confidence: 0.98 },
    { word: "training:", start: 26.1, end: 26.5, confidence: 0.80 },
    { word: "remove", start: 26.6, end: 26.9, confidence: 0.98 },
    { word: "cap,", start: 27.0, end: 27.3, confidence: 0.97 },
    { word: "insert", start: 27.4, end: 27.7, confidence: 0.98 },
    { word: "into", start: 27.8, end: 28.0, confidence: 0.99 },
    { word: "nostril,", start: 28.1, end: 28.5, confidence: 0.98 },
    { word: "press", start: 28.6, end: 28.9, confidence: 0.97 },
    { word: "plunger.", start: 29.0, end: 29.4, confidence: 0.97 },
    { word: "Call", start: 29.5, end: 29.8, confidence: 0.99 },
    { word: "nine", start: 29.9, end: 30.1, confidence: 0.97 },
    { word: "one", start: 30.2, end: 30.3, confidence: 0.98 },
    { word: "one", start: 30.4, end: 30.5, confidence: 0.98 },
    { word: "after.", start: 30.6, end: 30.9, confidence: 0.97 },
    { word: "That", start: 31.2, end: 31.4, confidence: 0.99 },
    { word: "sounds", start: 31.5, end: 31.8, confidence: 0.97 },
    { word: "straightforward.", start: 31.9, end: 32.4, confidence: 0.98 },
    { word: "Is", start: 32.5, end: 32.6, confidence: 0.99 },
    { word: "there", start: 32.7, end: 32.9, confidence: 0.98 },
    { word: "any", start: 33.0, end: 33.1, confidence: 0.97 },
    { word: "expiry", start: 33.2, end: 33.5, confidence: 0.97 },
    { word: "date", start: 33.6, end: 33.8, confidence: 0.98 },
    { word: "I", start: 33.9, end: 34.0, confidence: 0.99 },
    { word: "should", start: 34.1, end: 34.3, confidence: 0.97 },
    { word: "watch", start: 34.4, end: 34.7, confidence: 0.98 },
    { word: "for?", start: 34.8, end: 35.1, confidence: 0.97 },
    { word: "About", start: 35.4, end: 35.7, confidence: 0.98 },
    { word: "two", start: 35.8, end: 36.0, confidence: 0.99 },
    { word: "years.", start: 36.1, end: 36.4, confidence: 0.97 },
    { word: "Keep", start: 36.5, end: 36.8, confidence: 0.98 },
    { word: "at", start: 36.9, end: 37.0, confidence: 0.98 },
    { word: "room", start: 37.1, end: 37.4, confidence: 0.98 },
    { word: "temperature.", start: 37.5, end: 37.9, confidence: 0.80 },
    { word: "Perfect,", start: 38.2, end: 38.5, confidence: 0.97 },
    { word: "thank", start: 38.6, end: 38.8, confidence: 0.97 },
    { word: "you", start: 38.9, end: 39.1, confidence: 0.99 },
    { word: "so", start: 39.2, end: 39.4, confidence: 0.98 },
    { word: "much.", start: 39.5, end: 39.8, confidence: 0.98 },
    { word: "You're", start: 40.1, end: 40.4, confidence: 0.99 },
    { word: "welcome.", start: 40.5, end: 40.8, confidence: 0.97 },
    { word: "Here", start: 40.9, end: 41.2, confidence: 0.97 },
    { word: "is", start: 41.3, end: 41.4, confidence: 0.99 },
    { word: "the", start: 41.5, end: 41.6, confidence: 0.98 },
    { word: "kit.", start: 41.7, end: 41.9, confidence: 0.97 },
    { word: "Have", start: 42.1, end: 42.3, confidence: 0.98 },
    { word: "a", start: 42.4, end: 42.5, confidence: 0.99 },
    { word: "safe", start: 42.6, end: 42.8, confidence: 0.97 },
    { word: "day.", start: 42.9, end: 43.2, confidence: 0.98 },
    { word: "You", start: 43.5, end: 43.7, confidence: 0.99 },
    { word: "too.", start: 43.8, end: 44.1, confidence: 0.97 },
  ]
};

const DEMO_NOTES = `Meeting Notes - Project Kickoff

Attendees:
- John Smith (Client)
- Sarah Johnson (Project Manager)

Key Discussion Points:
1. Project timeline: 6 weeks for initial prototype
2. Budget constraints and resource allocation
3. Technical requirements and specifications
4. Communication channels and reporting structure

Action Items:
- Sarah to send detailed project plan by Friday
- John to provide access to required systems by Wednesday
- Schedule weekly progress meetings every Monday at 10 AM

Next Steps:
Follow-up meeting scheduled for next week to review initial designs.`;

export default function TranscriptViewer({ transcript: initialTranscript }: TranscriptViewerProps) {
  // State for the transcript data that can be edited
  const [transcript, setTranscript] = useState(initialTranscript)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [displayMode, setDisplayMode] = useState<'time' | 'full'>('full')
  const [sendingToClient, setSendingToClient] = useState(false)
  const [sendingToAdmin, setSendingToAdmin] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit mode states
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(
    isDemoMode ? (transcript.transcript || DEMO_TRANSCRIPT_JSON.words.map(w => w.word).join(' ')) : transcript.transcript || ''
  )
  const [editedNotes, setEditedNotes] = useState(
    isDemoMode ? (transcript.notes || DEMO_NOTES) : transcript.notes || ''
  )
  
  // Update edited content when demo mode changes
  useEffect(() => {
    if (isDemoMode) {
      setEditedTranscript(transcript.transcript || DEMO_TRANSCRIPT_JSON.words.map(w => w.word).join(' '));
      setEditedNotes(transcript.notes || DEMO_NOTES);
    } else {
      setEditedTranscript(transcript.transcript || '');
      setEditedNotes(transcript.notes || '');
    }
  }, [isDemoMode, transcript.transcript, transcript.notes]);
  
  // Use demo data or real data based on demo mode
  const transcriptText = isDemoMode 
    ? transcript.transcript || DEMO_TRANSCRIPT_JSON.words.map(w => w.word).join(' ')
    : transcript.transcript || '';
    
  const transcriptJson = isDemoMode
    ? DEMO_TRANSCRIPT_JSON
    : transcript.transcriptJson;
    
  const notes = isDemoMode
    ? transcript.notes || DEMO_NOTES
    : transcript.notes;

  // Client and admin email from transcript data
  const clientEmail = isDemoMode ? 'john.smith@example.com' : transcript.clientEmail
  const clientName = isDemoMode ? 'John Smith' : transcript.clientName
  const adminEmail = isDemoMode ? 'sarah.johnson@example.com' : transcript.hostEmail
  const adminName = isDemoMode ? 'Sarah Johnson' : transcript.hostName
  
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
    if (isDemoMode) {
      // Update local state in demo mode without making API calls
      if (type === 'transcript') {
        setTranscript(prevState => ({
          ...prevState,
          transcript: editedTranscript
        }));
        setIsEditingTranscript(false);
      } else if (type === 'notes') {
        setTranscript(prevState => ({
          ...prevState,
          notes: editedNotes
        }));
        setIsEditingNotes(false);
      }
      toast.success(`${type === 'transcript' ? 'Transcript' : 'Notes'} updated in demo mode`);
      return;
    }
    
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
        body: JSON.stringify({
          transcriptId: transcript.id,
          recipient: {
            email,
            name: name || email.split('@')[0]
          },
          subject: `Meeting Transcript: ${transcript.title || 'Untitled Meeting'}`,
          includeNotes: true,
          includeTranscript: true
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
      {isDemoMode && (
        <div className="bg-accent/20 border border-accent rounded-md p-2 mb-4 text-sm flex items-center justify-between">
          <span className="font-medium">Demo Mode Active - Changes won&apos;t be saved to database</span>
        </div>
      )}
      
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
                      <span>Send to Client</span>
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
                      <span>Send to Admin</span>
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
          
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md",
              isDemoMode 
                ? "bg-accent text-accent-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {isDemoMode ? 'Exit Demo Mode' : 'Enter Demo Mode'}
          </button>
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
        ) : transcript.status === 'completed' || isDemoMode ? (
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