"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import { useState, useEffect } from 'react'
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  readOnly = false
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      ListItem,
      StarterKit.configure({
        document: false,
        paragraph: false,
        bold: false,
        italic: false,
        heading: false,
        bulletList: false,
        listItem: false,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none',
      },
    },
  })

  // Important to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  if (!isMounted) {
    return null
  }

  // Toolbar button component
  const ToolbarButton = ({ 
    isActive = false,
    onClick,
    children 
  }: { 
    isActive?: boolean
    onClick: () => void
    children: React.ReactNode 
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "p-1 rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn("border border-border rounded-md p-3", className)}>
      {editor && !readOnly && (
        <div className="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-border">
          <ToolbarButton 
            isActive={editor.isActive('bold')} 
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton 
            isActive={editor.isActive('italic')} 
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton 
            isActive={editor.isActive('underline')} 
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="h-4 w-px bg-border mx-1" />
          
          <ToolbarButton 
            isActive={editor.isActive('heading', { level: 1 })} 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton 
            isActive={editor.isActive('heading', { level: 2 })} 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          
          <div className="h-4 w-px bg-border mx-1" />
          
          <ToolbarButton 
            isActive={editor.isActive('bulletList')} 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
      
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[100px] w-full focus:outline-none",
          readOnly ? "prose-p:m-0" : ""
        )}
      />
      
      {!content && !readOnly && (
        <div className="absolute top-0 left-0 p-3 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
} 