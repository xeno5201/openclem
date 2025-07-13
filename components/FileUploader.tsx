"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, File, CheckCircle, AlertCircle, Info } from "lucide-react"

interface FileUploaderProps {
  onFileUploaded: (url: string, filename?: string) => void
  onLoadingChange: (loading: boolean) => void
}

export default function FileUploader({ onFileUploaded, onLoadingChange }: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Reset previous states
      setErrorMessage("")
      setUploadStatus("idle")

      // Validate file type
      const validTypes = [".gltf", ".glb", ".obj", ".stl"]
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

      if (!validTypes.includes(fileExtension)) {
        setUploadStatus("error")
        setErrorMessage("Please upload a GLTF, GLB, OBJ, or STL file")
        return
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadStatus("error")
        setErrorMessage("File size must be less than 50MB")
        return
      }

      try {
        setUploadStatus("uploading")
        setUploadProgress(0)
        onLoadingChange(true)

        const formData = new FormData()
        formData.append("model", file)

        console.log("Uploading file:", file.name, "Size:", file.size, "Type:", fileExtension)

        // Use only local upload
        const response = await fetch("/api/upload-local", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Upload failed")
        }

        console.log("Upload successful:", data)

        setUploadProgress(100)
        setUploadStatus("success")
        onFileUploaded(data.url, file.name)
      } catch (error) {
        console.error("Upload error:", error)
        setUploadStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.")
      } finally {
        onLoadingChange(false)
      }
    },
    [onFileUploaded, onLoadingChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "model/gltf-binary": [".glb"],
      "model/gltf+json": [".gltf"],
      "model/obj": [".obj"],
      "model/stl": [".stl"],
    },
    maxFiles: 1,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the file here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">Drag & drop a 3D model file here</p>
            <p className="text-sm text-gray-500 mb-4">or click to select</p>
            <Button variant="outline">Choose File</Button>
          </div>
        )}
      </div>

      {uploadStatus === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span className="text-sm">Uploading...</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Upload successful!</span>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Local Storage Mode:</p>
            <p>
              • <strong>GLTF/GLB:</strong> Full 3D preview with materials
            </p>
            <p>
              • <strong>OBJ/STL:</strong> Upload only (limited preview)
            </p>
            <p className="text-blue-600 mt-1">Files are stored locally on this server</p>
          </div>
        </div>
      </div>
    </div>
  )
}
