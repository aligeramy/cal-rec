"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Sparkles, Plus, User } from 'lucide-react'
import { getTemplateNames } from '@/lib/conversation-templates'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

interface Client {
  name: string;
  email: string | null;
  displayName: string;
}

interface User {
  id: string;
  name: string;
  email: string | null;
  displayName: string;
}

interface AIConversationGeneratorProps {
  onConversationGenerated?: (transcriptId: string) => void;
}

export default function AIConversationGenerator({ onConversationGenerated }: AIConversationGeneratorProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [customClientName, setCustomClientName] = useState('')
  const [customClientEmail, setCustomClientEmail] = useState('')
  const [selectedHost, setSelectedHost] = useState('')
  const [title, setTitle] = useState('')
  const [customTemplate, setCustomTemplate] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showCustomClient, setShowCustomClient] = useState(false)

  const templates = getTemplateNames()
  const isCustomTemplate = templateId === 'custom'

  // Auto-populate host when dialog opens
  useEffect(() => {
    if (isOpen && session?.user) {
      // Find the current user in the users list and select them
      const currentUser = users.find(user => user.email === session.user?.email)
      if (currentUser) {
        setSelectedHost(currentUser.displayName)
      }
    }
  }, [isOpen, session, users])

  // Fetch clients and users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchUsers()
    }
  }, [isOpen])

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else {
        console.error('Failed to fetch clients')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      if (!templateId) {
        toast.error('Please select a conversation template')
        return
      }

      if (isCustomTemplate && !customTemplate.trim()) {
        toast.error('Please enter a custom template prompt')
        return
      }

      if (showCustomClient && !customClientName.trim()) {
        toast.error('Please enter a client name')
        return
      }

      if (!showCustomClient && !selectedClient) {
        toast.error('Please select a client or add a new one')
        return
      }

      if (!selectedHost) {
        toast.error('Please select a host')
        return
      }

      const response = await fetch('/api/transcripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          customTemplate: isCustomTemplate ? customTemplate : undefined,
          clientName: showCustomClient ? customClientName : selectedClient,
          clientEmail: showCustomClient ? customClientEmail : undefined,
          hostName: selectedHost,
          hostEmail: undefined,
          title: `${templates.find(t => t.id === templateId)?.name || 'Custom Template'}`
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`AI conversation generated successfully! Duration: ${result.data.duration} minutes`)
        
        // Reset form
        setTemplateId('')
        setSelectedClient('')
        setCustomClientName('')
        setCustomClientEmail('')
        setSelectedHost('')
        setTitle('')
        setCustomTemplate('')
        setShowCustomClient(false)
        setIsOpen(false)

        // Notify parent component
        if (onConversationGenerated) {
          onConversationGenerated(result.data.id)
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate conversation')
      }
    } catch (error) {
      console.error('Error generating conversation:', error)
      toast.error(`Failed to generate conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100 text-purple-700 hover:text-purple-800"
        >
          <span>Generate Conversation</span>
          <Sparkles className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Generate Conversation</span>
          </DialogTitle>
          <DialogDescription>
            Create a realistic conversation using AI based on professional templates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Conversation Template *</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="text-left w-full">
                <SelectValue placeholder="Select a conversation type..." className="text-left" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id} className="text-left">
                    <div className="text-left">
                      <div className="font-medium text-left">{template.name}</div>
                      <div className="text-xs text-muted-foreground text-left">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="text-left">
                  <div className="text-left">
                    <div className="font-medium text-left">Custom Template</div>
                    <div className="text-xs text-muted-foreground text-left">Create your own conversation template</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Template Input */}
          {isCustomTemplate && (
            <div className="space-y-2">
              <Label htmlFor="customTemplate">Custom Template Prompt *</Label>
              <textarea
                id="customTemplate"
                placeholder="Describe the type of conversation you want to generate. Be specific about the context, tone, and topics to be discussed..."
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                className="w-full min-h-[120px] p-3 bg-background rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Example: &quot;A friendly consultation between a web developer and a small business owner discussing a new website project, including timeline, features, and budget considerations.&quot;
              </p>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client Selection *</Label>
            
            {!showCustomClient ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select value={selectedClient} onValueChange={setSelectedClient} disabled={loadingClients}>
                    <SelectTrigger className="text-left w-full">
                      <SelectValue 
                        placeholder={loadingClients ? "Loading clients..." : "Select an existing client..."} 
                        className="text-left"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.displayName} value={client.displayName} className="text-left">
                          <div className="flex items-center space-x-2 text-left">
                            <User className="h-4 w-4" />
                            <span className="truncate max-w-[200px]" title={client.displayName}>
                              {client.displayName.length > 30 ? `${client.displayName.substring(0, 30)}...` : client.displayName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {clients.length === 0 && !loadingClients && (
                        <SelectItem value="no-clients" disabled className="text-left">
                          <span className="text-muted-foreground">No existing clients found</span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-muted-foreground font-medium">
                  or
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomClient(true)}
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">New Client Details</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomClient(false)
                      setCustomClientName('')
                      setCustomClientEmail('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="customClientName" className="text-xs">Client Name *</Label>
                    <Input
                      id="customClientName"
                      placeholder="Enter client name"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customClientEmail" className="text-xs">Client Email</Label>
                    <Input
                      id="customClientEmail"
                      type="email"
                      placeholder="client@example.com"
                      value={customClientEmail}
                      onChange={(e) => setCustomClientEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Host Selection */}
          <div className="space-y-2">
            <Label>Host Selection *</Label>
            <Select value={selectedHost} onValueChange={setSelectedHost} disabled={loadingUsers}>
              <SelectTrigger className="text-left w-full">
                <SelectValue 
                  placeholder={loadingUsers ? "Loading hosts..." : "Select a host..."} 
                  className="text-left"
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.displayName} value={user.displayName} className="text-left">
                    <div className="flex items-center space-x-2 text-left">
                      <User className="h-4 w-4" />
                      <span className="truncate max-w-[200px]" title={user.displayName}>
                        {user.displayName.length > 30 ? `${user.displayName.substring(0, 30)}...` : user.displayName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {users.length === 0 && !loadingUsers && (
                  <SelectItem value="no-hosts" disabled className="text-left">
                    <span className="text-muted-foreground">No existing hosts found</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Auto-generated based on template"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">AI Generation Info:</div>
                <ul className="text-xs space-y-1">
                  <li>• Conversations are generated using OpenAI GPT-4</li>
                  <li>• Each template creates realistic, professional dialogue</li>
                  <li>• Generated conversations include proper timing and speaker separation</li>
                  <li>• Perfect for testing and demonstration purposes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !templateId || (isCustomTemplate && !customTemplate.trim()) || (!selectedClient && !showCustomClient) || (showCustomClient && !customClientName.trim()) || !selectedHost}
            className={cn(
              "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
              isGenerating && "opacity-50"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Conversation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 