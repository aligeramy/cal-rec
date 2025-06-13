"use client"

import { useState, useEffect } from 'react'
import { MeetingTranscript } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Mail, Send, Edit, Save, X, FileText, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TranscriptViewerProps {
  transcript: MeetingTranscript
}

export default function TranscriptViewer({ transcript: initialTranscript }: TranscriptViewerProps) {
  // State for the transcript data that can be edited
  const [transcript, setTranscript] = useState<MeetingTranscript>(initialTranscript)
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sendingToClient, setSendingToClient] = useState(false)
  const [sendingToAdmin, setSendingToAdmin] = useState(false)
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  
  // View mode states
  const [viewMode, setViewMode] = useState<'speaker' | 'full'>('speaker')
  
  // Edit states
  const [editedTranscript, setEditedTranscript] = useState(transcript.transcript || '')
  const [editedNotes, setEditedNotes] = useState(transcript.notes || '')
  const [editedHostName, setEditedHostName] = useState(transcript.hostName || '')
  const [editedHostEmail, setEditedHostEmail] = useState(transcript.hostEmail || '')
  const [editedStartTime, setEditedStartTime] = useState(
    transcript.startTime ? new Date(transcript.startTime).toISOString().slice(0, 16) : ''
  )
  const [editedEndTime, setEditedEndTime] = useState(
    transcript.endTime ? new Date(transcript.endTime).toISOString().slice(0, 16) : ''
  )
  const [editedDuration, setEditedDuration] = useState(transcript.duration?.toString() || '')
  
  // Update edited content when transcript changes
  useEffect(() => {
    setEditedTranscript(transcript.transcript || '');
    setEditedNotes(transcript.notes || '');
    setEditedHostName(transcript.hostName || '');
    setEditedHostEmail(transcript.hostEmail || '');
    setEditedStartTime(transcript.startTime ? new Date(transcript.startTime).toISOString().slice(0, 16) : '');
    setEditedEndTime(transcript.endTime ? new Date(transcript.endTime).toISOString().slice(0, 16) : '');
    setEditedDuration(transcript.duration?.toString() || '');
  }, [transcript]);
  
  // Use real transcript data
  const transcriptText = transcript.transcript || 'No transcript available'
  
  // Debug transcript data (remove these in production)
  // console.log('Full transcript object:', transcript)
  // console.log('transcript.transcript:', transcript.transcript)
  // console.log('transcript.transcriptJson:', transcript.transcriptJson)

  // Client and admin email from transcript data
  const clientEmail = transcript.clientEmail
  const clientName = transcript.clientName
  const adminEmail = transcript.hostEmail
  const adminName = transcript.hostName

  // Parse transcript JSON for speaker view
  interface SpeakerUtterance {
    id: number;
    speaker: string;
    speakerId: number;
    text: string;
    start: number;
    end: number;
  }

  // Helper function to parse text transcript into speaker segments
  const parseTranscriptText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const segments: { text: string; speaker: string }[] = []
    let currentSpeaker = ''
    let currentText = ''
    
    for (const line of lines) {
      // Check if line starts with a speaker name (ends with :)
      if (line.includes(':') && !line.startsWith(' ')) {
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({ text: currentText.trim(), speaker: currentSpeaker })
        }
        // Start new segment
        const colonIndex = line.indexOf(':')
        currentSpeaker = line.substring(0, colonIndex).trim()
        currentText = line.substring(colonIndex + 1).trim()
      } else {
        // Continue current segment
        currentText += ' ' + line.trim()
      }
    }
    
    // Don't forget the last segment
    if (currentText.trim()) {
      segments.push({ text: currentText.trim(), speaker: currentSpeaker })
    }
    
    return segments
  }

  const parseTranscriptForSpeakers = (): SpeakerUtterance[] => {
    try {
      if (!transcript.transcriptJson) {
        console.log('No transcriptJson found, trying to parse from plain text')
        // Fallback: try to create speakers from plain text if JSON not available
        if (transcript.transcript) {
          const lines = transcript.transcript.split('\n').filter(line => line.trim())
          return lines.map((line, index) => ({
            id: index,
            speaker: index % 2 === 0 ? (clientName || 'Client') : (adminName || 'Host'),
            speakerId: index % 2,
            text: line.trim(),
            start: index * 10,
            end: (index * 10) + 10
          }))
        }
        return []
      }
      
      const transcriptData = typeof transcript.transcriptJson === 'string' 
        ? JSON.parse(transcript.transcriptJson) 
        : transcript.transcriptJson

      if (transcriptData?.utterances && Array.isArray(transcriptData.utterances)) {
        
        // If utterances don't have text, try to extract from main transcript
        const hasTextInUtterances = transcriptData.utterances.some((u: { text?: string; transcript?: string }) => (u.text && u.text.trim()) || (u.transcript && u.transcript.trim()))
        
        if (!hasTextInUtterances && transcript.transcript) {
          // Parse the main transcript to extract speaker segments  
          const textSegments = parseTranscriptText(transcript.transcript)
          
          return transcriptData.utterances.map((utterance: { speaker: number; text?: string; transcript?: string; start?: number; end?: number }, index: number) => {
            const textSegment = textSegments[index] || { text: '', speaker: '' }
            return {
              id: index,
              speaker: utterance.speaker === 0 ? (clientName || 'Client') : (adminName || 'Host'),
              speakerId: utterance.speaker,
              text: utterance.text || utterance.transcript || textSegment.text || '',
              start: utterance.start || 0,
              end: utterance.end || 0
            }
          })
        }
        
        return transcriptData.utterances.map((utterance: { speaker: number; text?: string; transcript?: string; start?: number; end?: number }, index: number) => ({
          id: index,
          speaker: utterance.speaker === 0 ? (clientName || 'Client') : (adminName || 'Host'),
          speakerId: utterance.speaker,
          text: utterance.text || utterance.transcript || '',
          start: utterance.start || 0,
          end: utterance.end || 0
        }))
      }

      // Try alternative structure
      if (transcriptData?.segments && Array.isArray(transcriptData.segments)) {
        return transcriptData.segments.map((segment: { speaker: number; text: string; duration?: number }, index: number) => ({
          id: index,
          speaker: segment.speaker === 0 ? (clientName || 'Client') : (adminName || 'Host'),
          speakerId: segment.speaker,
          text: segment.text || '',
          start: index * (segment.duration || 10),
          end: (index + 1) * (segment.duration || 10)
        }))
      }
      
      return []
    } catch (error) {
      console.error('Error parsing transcript JSON:', error)
      return []
    }
  }

  const speakerUtterances = parseTranscriptForSpeakers()
  
  // Save edited content to the database
  const saveEdits = async (type: 'transcript' | 'notes' | 'details') => {
    setIsSaving(true)
    
    try {
      const dataToUpdate: {
        id: string;
        transcript?: string;
        notes?: string;
        hostName?: string;
        hostEmail?: string;
        startTime?: string;
        endTime?: string;
        duration?: number | null;
      } = {
        id: transcript.id,
      };
      
      if (type === 'transcript') {
        dataToUpdate.transcript = editedTranscript;
      } else if (type === 'notes') {
        dataToUpdate.notes = editedNotes;
      } else if (type === 'details') {
        dataToUpdate.hostName = editedHostName;
        dataToUpdate.hostEmail = editedHostEmail;
        dataToUpdate.startTime = editedStartTime;
        dataToUpdate.endTime = editedEndTime;
        dataToUpdate.duration = editedDuration ? parseInt(editedDuration) : null;
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
        const result = await response.json();
        setTranscript(result.data);
        
        toast.success(`${type === 'transcript' ? 'Transcript' : type === 'notes' ? 'Notes' : 'Meeting details'} updated successfully`)
        
        // Exit edit mode
        if (type === 'transcript') setIsEditingTranscript(false)
        if (type === 'notes') setIsEditingNotes(false)
        if (type === 'details') setIsEditingDetails(false)
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
  
  // Generate notes based on transcript
  const generateNotes = async () => {
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
        toast.success('Notes generated successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate notes')
      }
    } catch (error) {
      console.error('Error generating notes:', error)
      toast.error(`Failed to generate notes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingNotes(false)
    }
  }
  
  const renderSectionHeader = (title: string, isEditing: boolean, setEditing: (editing: boolean) => void, handleSave: () => void, showGenerateButton?: boolean, showViewOptions?: boolean) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex space-x-2">
        {/* View mode buttons for transcript */}
        {showViewOptions && !isEditing && (
          <div className="flex items-center space-x-1 mr-2">
            <button
              onClick={() => setViewMode('speaker')}
              className={`inline-flex items-center text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'speaker' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-primary border border-border hover:bg-secondary/30'
              }`}
            >
              Speaker View
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`inline-flex items-center text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'full' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-primary border border-border hover:bg-secondary/30'
              }`}
            >
              Full View
            </button>
          </div>
        )}
        
        {/* Generate Notes button for notes when editing */}
        {showGenerateButton && isEditing && (
          <button
            onClick={generateNotes}
            disabled={isGeneratingNotes}
            className="inline-flex items-center text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isGeneratingNotes ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <FileText className="h-3 w-3 mr-1" />
            )}
            {isGeneratingNotes ? 'Generating...' : 'Generate Notes'}
          </button>
        )}
        
        {!isEditing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
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
              className="inline-flex items-center text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
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
    <div className="p-6 space-y-6">
      {/* PDF Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">PDF Actions</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View PDF Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => window.open(`/api/transcripts/${transcript.id}/pdf`, '_blank')}
                    className="inline-flex items-center text-sm px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open comprehensive PDF with all views</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Send to Client */}
            {clientEmail && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => sendEmail('client')}
                      disabled={sendingToClient}
                      className="inline-flex items-center text-sm px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {sendingToClient ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Send to Client
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send PDF to {clientName || clientEmail}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Send to Admin */}
            {adminEmail && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => sendEmail('admin')}
                      disabled={sendingToAdmin}
                      className="inline-flex items-center text-sm px-3 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
                    >
                      {sendingToAdmin ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send to Admin
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send PDF to {adminName || adminEmail}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      
      {/* Meeting Details Section */}
      <div className="border-t border-border pt-6">
        {renderSectionHeader(
          "Meeting Details", 
          isEditingDetails, 
          setIsEditingDetails,
          () => saveEdits('details')
        )}
        
        {isEditingDetails ? (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg border">
            <div>
              <label className="block text-sm font-medium mb-1">Host Name</label>
              <input
                type="text"
                value={editedHostName}
                onChange={(e) => setEditedHostName(e.target.value)}
                className="w-full p-2 rounded border"
                placeholder="Host name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Host Email</label>
              <input
                type="email"
                value={editedHostEmail}
                onChange={(e) => setEditedHostEmail(e.target.value)}
                className="w-full p-2 rounded border"
                placeholder="host@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={editedStartTime}
                onChange={(e) => setEditedStartTime(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                value={editedEndTime}
                onChange={(e) => setEditedEndTime(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={editedDuration}
                onChange={(e) => setEditedDuration(e.target.value)}
                className="w-full p-2 rounded border"
                placeholder="60"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
            <div>
              <span className="block text-sm font-medium text-muted-foreground">Host Name</span>
              <span className="text-sm text-foreground">{transcript.hostName || 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-muted-foreground">Host Email</span>
              <span className="text-sm text-foreground">{transcript.hostEmail || 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-muted-foreground">Start Time</span>
              <span className="text-sm text-foreground">{transcript.startTime ? formatDate(transcript.startTime) : 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-muted-foreground">End Time</span>
              <span className="text-sm text-foreground">{transcript.endTime ? formatDate(transcript.endTime) : 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-muted-foreground">Duration</span>
              <span className="text-sm text-foreground">{transcript.duration ? `${transcript.duration} minutes` : 'Not specified'}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Transcript Content */}
      <div className="border-t border-border pt-6">
        {renderSectionHeader(
          "Full Transcript", 
          isEditingTranscript, 
          setIsEditingTranscript,
          () => saveEdits('transcript'),
          false,
          true
        )}
        
        {isEditingTranscript ? (
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="w-full min-h-[300px] p-4 bg-muted rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter transcript text..."
          />
        ) : transcript.status === 'completed' ? (
          <div className="bg-muted/50 rounded-lg p-6 text-sm border">
            {viewMode === 'speaker' ? (
              speakerUtterances.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {speakerUtterances.map((utterance) => (
                    <div key={utterance.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        utterance.speakerId === 0 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {utterance.speaker.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {utterance.speaker}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor(utterance.start / 60)}:{(utterance.start % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg text-sm leading-relaxed ${
                          utterance.speakerId === 0 
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100' 
                            : 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                        }`}>
                          {utterance.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Speaker data not available</h3>
                  <p className="text-muted-foreground mb-4">
                    This transcript doesn&apos;t have speaker-separated data. Try the Full View instead.
                  </p>
                  <button
                    onClick={() => setViewMode('full')}
                    className="text-primary hover:underline text-sm"
                  >
                    Switch to Full View →
                  </button>
                </div>
              )
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-sm max-h-96 overflow-y-auto pr-2">
                {transcriptText}
                {transcriptText === 'No transcript available' && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No transcript content found.</p>
                    <p className="text-xs mt-2">Transcript ID: {transcript.id}</p>
                    <p className="text-xs">Status: {transcript.status}</p>
                  </div>
                )}
              </div>
            )}
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
              className="w-full min-h-[200px] max-h-[400px] p-4 bg-muted rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter meeting notes in Markdown format or click 'Generate Notes' to create notes automatically from the transcript..."
            />
            {!transcript.notes && !editedNotes && (
              <p className="text-sm text-muted-foreground">
                💡 Tip: Click &quot;Generate Notes&quot; to automatically create professional meeting notes in Markdown format based on the transcript content.
              </p>
            )}
          </div>
        ) : transcript.notes ? (
          <div className="bg-muted/50 rounded-lg border max-h-[500px] overflow-y-auto">
            <div className="p-4 text-sm markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {transcript.notes}
              </ReactMarkdown>
            </div>
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
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 