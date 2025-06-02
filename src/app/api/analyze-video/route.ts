import type { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { systemPrompt } from "./prompt";

// Initialize Google AI File Manager
const fileManager = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, mimeType = "video/webm" } = body;

    if (!filePath) {
      return new Response("No file path provided", { status: 400 });
    }

    console.log("Uploading file to Google GenAI:", filePath);

    let uploadedFile = await fileManager.files.upload({
      file: filePath,
      config: {
        mimeType: mimeType || "video/webm",
      },
    });

    console.log("Initial upload state:", uploadedFile.state);

    // Check the file status until it becomes ACTIVE
    while (uploadedFile.state === "PROCESSING") {
      console.log("File is still processing, waiting 1 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 10 seconds

      // Get the file again to update the state
      if (!uploadedFile.name) {
        console.error("Uploaded file has no name");
        return new Response("Uploaded file has no name", { status: 500 });
      }

      uploadedFile = await fileManager.files.get({
        name: uploadedFile.name,
      });
      console.log("Updated file state:", uploadedFile.state);
    }

    if (uploadedFile.state === "FAILED") {
      console.error("File upload failed:", uploadedFile.state);
      return new Response("File upload failed", { status: 500 });
    }

    console.log("File is ready for analysis. State:", uploadedFile.state);

    if (!uploadedFile.uri) {
      return new Response("No file URI provided", { status: 400 });
    }
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });

    // Initialize Google GenAI with AI SDK
    const model = google("gemini-2.5-flash-preview-05-20");

    console.log("Starting video analysis with Gemini via AI SDK...");

    // Create a stream response using AI SDK with file attachment
    const result = streamText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: uploadedFile.uri,
              mimeType: mimeType,
            },
            {
              type: "text",
              text: systemPrompt,
            },
          ],
        },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    console.log("Streaming analysis response...");

    // Return the stream response in the correct format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error analyzing video:", error);

    // Return a more detailed error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: "Error analyzing video",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
