"use client"

import { Suspense, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Center, useGLTF, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react"

interface SceneCanvasProps {
  modelUrl: string | null
  isLoading: boolean
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, true)
  const [error, setError] = useState<string | null>(null)

  if (error) {
    console.error("GLTF loading error:", error)
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    )
  }

  return <primitive object={scene} />
}

function ErrorDisplay({ message, url }: { message: string; url: string }) {
  return (
    <>
      <mesh>
        <boxGeometry args={[3, 2, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <Html center>
        <div className="bg-white p-3 rounded-lg shadow-lg text-center max-w-sm">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <div className="text-sm font-medium text-gray-900 mb-1">Loading Error</div>
          <div className="text-xs text-gray-600 mb-2">{message}</div>
          <div className="text-xs text-gray-400 break-all">{url}</div>
        </div>
      </Html>
    </>
  )
}

function UnsupportedModel({ format }: { format: string }) {
  return (
    <>
      <mesh>
        <boxGeometry args={[3, 2, 1]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      <Html center>
        <div className="bg-white p-3 rounded-lg shadow-lg text-center max-w-xs">
          <div className="text-sm font-medium text-gray-900 mb-1">{format.toUpperCase()} Preview</div>
          <div className="text-xs text-gray-600">Currently only GLTF/GLB files are fully supported for 3D preview</div>
        </div>
      </Html>
    </>
  )
}

function ModelViewer({ url }: { url: string }) {
  const fileExtension = url.toLowerCase().substring(url.lastIndexOf("."))

  console.log("Loading model:", url, "Extension:", fileExtension)

  switch (fileExtension) {
    case ".gltf":
    case ".glb":
      return (
        <Center>
          <GLTFModel url={url} />
        </Center>
      )
    case ".obj":
      return (
        <Center>
          <UnsupportedModel format="obj" />
        </Center>
      )
    case ".stl":
      return (
        <Center>
          <UnsupportedModel format="stl" />
        </Center>
      )
    default:
      return (
        <Center>
          <ErrorDisplay message={`Unsupported file format: ${fileExtension}`} url={url} />
        </Center>
      )
  }
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading model...</span>
      </div>
    </Html>
  )
}

export default function SceneCanvas({ modelUrl, isLoading }: SceneCanvasProps) {
  const controlsRef = useRef<any>()

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Reset Camera Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button variant="outline" size="sm" onClick={resetCamera} className="bg-white/90 backdrop-blur-sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset View
        </Button>
      </div>

      {/* Debug Info */}
      {modelUrl && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
            Loading: {modelUrl}
          </div>
        </div>
      )}

      <Canvas camera={{ position: [5, 5, 5], fov: 50 }} className="w-full h-full">
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={50}
          autoRotate={false}
        />

        {/* Model or Placeholder */}
        <Suspense fallback={<LoadingSpinner />}>
          {modelUrl ? (
            <ModelViewer url={modelUrl} />
          ) : (
            <mesh>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#e5e7eb" />
            </mesh>
          )}
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Processing upload...</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!modelUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-lg">Upload a 3D model to get started</p>
            <p className="text-sm mt-2">Drag and drop or click to select a file</p>
            <p className="text-xs mt-1 text-gray-400">Best support for GLTF and GLB formats</p>
          </div>
        </div>
      )}
    </div>
  )
}
