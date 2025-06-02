import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    // The path array should contain the full file path from the database
    // For example: ["D:", "Coding", "articulator", "uploads", "video_123.webm"]
    let fullPath: string;

    // Check if this is a Windows absolute path starting with drive letter
    if (pathSegments[0]?.match(/^[A-Za-z]:$/)) {
      // Reconstruct Windows absolute path
      fullPath = pathSegments.join("\\");
    } else {
      // Join as regular path
      fullPath = pathSegments.join("/");
    }

    console.log("Trying to serve video from:", fullPath);

    // Security check - ensure the path contains uploads directory
    if (!fullPath.includes("uploads")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = "video/mp4";

    if (ext === ".webm") {
      contentType = "video/webm";
    } else if (ext === ".mov") {
      contentType = "video/quicktime";
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving video file:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
