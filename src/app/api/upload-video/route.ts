import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Initialize Google AI File Manager
const fileManager = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

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

    console.log("Video saved locally, now uploading to Google GenAI...");

    // Upload file to Google GenAI
    let uploadedFile = await fileManager.files.upload({
      file: filePath,
      config: {
        mimeType: fileExtension === "webm" ? "video/webm" : "video/mp4",
      },
    });

    console.log("Initial upload state:", uploadedFile.state);

    // Wait for file processing
    while (uploadedFile.state === "PROCESSING") {
      console.log("File is still processing, waiting 1 second...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!uploadedFile.name) {
        console.error("Uploaded file has no name");
        return NextResponse.json(
          { error: "Uploaded file has no name" },
          { status: 500 }
        );
      }

      uploadedFile = await fileManager.files.get({
        name: uploadedFile.name,
      });
      console.log("Updated file state:", uploadedFile.state);
    }

    if (uploadedFile.state === "FAILED") {
      console.error("File upload failed:", uploadedFile.state);
      return NextResponse.json(
        { error: "File upload to Google failed" },
        { status: 500 }
      );
    }

    console.log("File is ready for analysis. State:", uploadedFile.state);

    if (!uploadedFile.uri) {
      return NextResponse.json(
        { error: "No Google file URI provided" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
      mimeType: fileExtension === "webm" ? "video/webm" : "video/mp4",
      googleFileUri: uploadedFile.uri,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { error: "Error uploading video" },
      { status: 500 }
    );
  }
}
