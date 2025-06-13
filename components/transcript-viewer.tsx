"use client"

import { useState, useEffect } from 'react'
import { MeetingTranscript } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, Mail, Send, Edit, Save, X, FileText } from 'lucide-react'
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

  // Client and admin email from transcript data
  const clientEmail = transcript.clientEmail
  const clientName = transcript.clientName
  const adminEmail = transcript.hostEmail
  const adminName = transcript.hostName
  
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
  
  const renderSectionHeader = (title: string, isEditing: boolean, setEditing: (editing: boolean) => void, handleSave: () => void, showGenerateButton?: boolean) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex space-x-2">
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
      <div className="flex justify-end items-center">
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
              <span className="block text-sm font-medium text-gray-500">Host Name</span>
              <span className="text-sm">{transcript.hostName || 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Host Email</span>
              <span className="text-sm">{transcript.hostEmail || 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Start Time</span>
              <span className="text-sm">{transcript.startTime ? formatDate(transcript.startTime) : 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">End Time</span>
              <span className="text-sm">{transcript.endTime ? formatDate(transcript.endTime) : 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Duration</span>
              <span className="text-sm">{transcript.duration ? `${transcript.duration} minutes` : 'Not specified'}</span>
            </div>
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
              className="w-full min-h-[200px] p-4 bg-muted rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter meeting notes or click 'Generate Notes' to create notes automatically from the transcript..."
            />
            {!transcript.notes && !editedNotes && (
              <p className="text-sm text-muted-foreground">
                💡 Tip: Click &quot;Generate Notes&quot; to automatically create professional meeting notes based on the transcript content.
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
              </button>
            </p>
          </div>
        )}
      </div>
      
      {/* Transcript Content */}
      <div className="border-t border-border pt-6">
        {renderSectionHeader(
          "Full Transcript", 
          isEditingTranscript, 
          setIsEditingTranscript,
          () => saveEdits('transcript')
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
            <div className="whitespace-pre-wrap leading-relaxed text-sm max-h-96 overflow-y-auto pr-2">
              {transcriptText}
            </div>
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
    </div>
  );
} 