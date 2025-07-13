export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = join(process.cwd(), "public", "uploads")

    try {
      const files = await readdir(uploadsDir)
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = join(uploadsDir, file)
          const stats = await stat(filePath)
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            url: `/api/files/${file}`,
            directUrl: `/uploads/${file}`,
          }
        }),
      )

      return NextResponse.json({
        uploadsDirectory: uploadsDir,
        files: fileDetails,
        count: files.length,
      })
    } catch (error) {
      return NextResponse.json({
        uploadsDirectory: uploadsDir,
        error: "Directory not found or empty",
        files: [],
        count: 0,
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to check uploads" }, { status: 500 })
  }
}
