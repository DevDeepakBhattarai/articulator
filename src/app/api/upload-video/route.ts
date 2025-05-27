import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Save the video file locally
    const fileExtension = videoFile.name.endsWith(".webm") ? "webm" : "mp4";
    const fileName = `video_${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    const bytes = await videoFile.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
      mimeType: fileExtension === "webm" ? "video/webm" : "video/mp4",
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Error uploading video" },
      { status: 500 }
    );
  }
}
