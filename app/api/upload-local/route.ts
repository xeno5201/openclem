export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("model") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = [".gltf", ".glb", ".obj", ".stl"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validTypes.includes(fileExtension)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const fileName = `${fileId}${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")

    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.log("Directory already exists or created")
    }

    // Convert file to buffer and save locally
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = join(uploadsDir, fileName)

    try {
      await writeFile(filePath, buffer)
      console.log(`File saved successfully to: ${filePath}`)
    } catch (writeError) {
      console.error("Error writing file:", writeError)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }

    // Return the API endpoint URL
    const publicUrl = `/api/files/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      id: fileId,
      filename: file.name,
      size: file.size,
      type: fileExtension,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
