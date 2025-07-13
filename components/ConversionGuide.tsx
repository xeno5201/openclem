"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Lightbulb } from "lucide-react"

export default function ConversionGuide() {
  const tools = [
    {
      name: "Blender",
      description: "Free 3D software with GLTF export",
      url: "https://www.blender.org/",
    },
    {
      name: "Online Converter",
      description: "Convert OBJ/STL to GLTF online",
      url: "https://products.aspose.app/3d/conversion",
    },
    {
      name: "Three.js Editor",
      description: "Browser-based 3D editor",
      url: "https://threejs.org/editor/",
    },
  ]

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-start space-x-3">
        <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">Need GLTF conversion?</h3>
          <p className="text-sm text-gray-600 mb-3">
            Convert your OBJ or STL files to GLTF/GLB for full 3D preview support:
          </p>
          <div className="space-y-2">
            {tools.map((tool, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{tool.name}</p>
                  <p className="text-xs text-gray-500">{tool.description}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
