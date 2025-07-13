export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filePath = params.path.join("/")
    const fullPath = join(process.cwd(), "public", "uploads", filePath)

    console.log(`Attempting to serve file: ${fullPath}`)

    // Check if file exists
    try {
      const stats = await stat(fullPath)
      console.log(`File found, size: ${stats.size} bytes`)
    } catch (statError) {
      console.error(`File not found: ${fullPath}`)
      return new NextResponse("File not found", { status: 404 })
    }

    // Read the file
    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(fullPath)
      console.log(`File read successfully, ${fileBuffer.length} bytes`)
    } catch (readError) {
      console.error(`Error reading file: ${readError}`)
      return new NextResponse("Error reading file", { status: 500 })
    }

    // Determine content type based on file extension
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf("."))
    let contentType = "application/octet-stream"

    switch (extension) {
      case ".gltf":
        contentType = "model/gltf+json"
        break
      case ".glb":
        contentType = "model/gltf-binary"
        break
      case ".obj":
        contentType = "text/plain"
        break
      case ".stl":
        contentType = "application/sla"
        break
      case ".bin":
        contentType = "application/octet-stream"
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
