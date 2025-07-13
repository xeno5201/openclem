"use client"

import { useState } from "react"
import FileUploader from "@/components/FileUploader"
import SceneCanvas from "@/components/SceneCanvas"
import ModelInfo from "@/components/ModelInfo"
import ConversionGuide from "@/components/ConversionGuide"
import DebugPanel from "@/components/DebugPanel"
import { Card } from "@/components/ui/card"

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const handleFileUploaded = (url: string, filename?: string) => {
    console.log("File uploaded:", url, filename)
    setModelUrl(url)
    if (filename) setFileName(filename)
  }

  const showConversionGuide = modelUrl && (modelUrl.endsWith(".obj") || modelUrl.endsWith(".stl"))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">3D Model Viewer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Upload Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Upload Model</h2>
              <div className="flex-1">
                <FileUploader onFileUploaded={handleFileUploaded} onLoadingChange={setIsLoading} />
              </div>
              <ModelInfo modelUrl={modelUrl} fileName={fileName} />
              {showConversionGuide && <ConversionGuide />}
            </Card>
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-2">
            <Card className="p-4 h-full">
              <SceneCanvas modelUrl={modelUrl} isLoading={isLoading} />
            </Card>
          </div>
        </div>
      </div>

      <DebugPanel />
    </div>
  )
}
