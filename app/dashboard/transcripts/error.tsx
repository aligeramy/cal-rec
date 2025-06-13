'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center space-x-2 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      </div>
      
      <p className="text-muted-foreground text-center max-w-md">
        We encountered an error while loading your transcripts. This might be a temporary issue.
      </p>
      
      <div className="flex space-x-2">
        <Button
          onClick={reset}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </Button>
        
        <Button
          onClick={() => window.location.href = '/dashboard'}
          variant="default"
        >
          Go to Dashboard
        </Button>
      </div>
      
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
} 