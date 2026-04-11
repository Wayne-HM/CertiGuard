"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full glass-strong border-glass-border p-8 rounded-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Failure</h2>
          <p className="text-muted-foreground">
            We encountered an error while loading your dashboard data. 
            <br />
            <span className="text-xs font-mono text-destructive/70 mt-2 block bg-black/20 p-2 rounded">
              {error.message || "Unknown rendering error"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 pt-4">
          Error Digest: {error.digest || "No digest available"}
        </p>
      </div>
    </div>
  )
}
