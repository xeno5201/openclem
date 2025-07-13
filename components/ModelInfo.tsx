"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface ModelInfoProps {
  modelUrl: string | null
  fileName?: string
}

export default function ModelInfo({ modelUrl, fileName }: ModelInfoProps) {
  if (!modelUrl) return null

  const fileExtension = modelUrl.toLowerCase().substring(modelUrl.lastIndexOf("."))

  const getFormatInfo = (ext: string) => {
    switch (ext) {
      case ".gltf":
      case ".glb":
        return {
          name: "GLTF/GLB",
          description: "Fully supported with materials, textures, and animations",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          supported: true,
        }
      case ".obj":
        return {
          name: "OBJ",
          description: "Upload successful - Limited preview support",
          color: "bg-yellow-100 text-yellow-800",
          icon: AlertTriangle,
          supported: false,
        }
      case ".stl":
        return {
          name: "STL",
          description: "Upload successful - Limited preview support",
          color: "bg-yellow-100 text-yellow-800",
          icon: AlertTriangle,
          supported: false,
        }
      default:
        return {
          name: "Unknown",
          description: "Unsupported format",
          color: "bg-red-100 text-red-800",
          icon: AlertTriangle,
          supported: false,
        }
    }
  }

  const formatInfo = getFormatInfo(fileExtension)
  const Icon = formatInfo.icon

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={formatInfo.color}>{formatInfo.name}</Badge>
            {fileName && <span className="text-sm text-gray-600 truncate">{fileName}</span>}
          </div>
          <p className="text-sm text-gray-500">{formatInfo.description}</p>
          {!formatInfo.supported && (
            <p className="text-xs text-gray-400 mt-1">For full 3D preview, convert to GLTF/GLB format</p>
          )}
        </div>
      </div>
    </Card>
  )
}
