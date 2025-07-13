"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Bug } from "lucide-react"

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("/api/test-upload")
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: "Failed to fetch debug info" })
    }
  }

  useEffect(() => {
    if (isVisible) {
      fetchDebugInfo()
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="fixed bottom-4 right-4 z-50">
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 max-w-md max-h-96 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Debug Info</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDebugInfo}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
            ×
          </Button>
        </div>
      </div>
      <div className="text-xs space-y-2">
        {debugInfo ? (
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </Card>
  )
}
