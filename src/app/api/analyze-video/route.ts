import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

// Initialize Google GenAI for file uploads
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, mimeType } = body;

    if (!filePath) {
      return new Response("No file path provided", { status: 400 });
    }

    // Upload the video file to Google GenAI
    const uploadedFile = await genAI.files.upload({
      file: filePath,
      config: { mimeType: mimeType || "video/webm" },
    });

    // Stream the analysis response
    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      prompt: `As a professional speaking coach, analyze this video recording for articulation, speaking pace, clarity, and overall communication effectiveness. 

Please provide:

1. **Overall Assessment**: Rate the speaking performance out of 10 and provide a brief summary
2. **Articulation Analysis**: Comment on pronunciation, enunciation, and clarity of words
3. **Pace & Rhythm**: Analyze speaking speed, pauses, and natural flow
4. **Vocal Quality**: Comment on tone, volume, and vocal variety
5. **Areas for Improvement**: Specific actionable feedback
6. **Strengths**: What the speaker did well
7. **Practice Exercises**: 2-3 targeted exercises to improve identified weaknesses

Be encouraging yet constructive in your feedback. Focus on helping the speaker become more articulate and confident.

Video file URI: ${uploadedFile.uri}`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error analyzing video:", error);
    return new Response("Error analyzing video", { status: 500 });
  }
}
