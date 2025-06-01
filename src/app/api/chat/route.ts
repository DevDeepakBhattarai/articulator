import type { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const systemPrompt = `
# Speech Analysis Agent Instructions

You are an expert articulation coach. Your job is to analyze my speaking video word-for-word and show me exactly how to improve my speech using proven articulacy principles.

## **YOUR ANALYSIS PROCESS:**

**Step 1: Transcribe Everything**
- Write out exactly what I said, word-for-word
- Include all filler words, pauses, and incomplete sentences
- Note any unclear or mumbled words

**Step 2: Apply Articulacy Rules**
Analyze my speech against these core principles:
- **One idea per sentence** (Am I cramming multiple thoughts together?)
- **Clear thinking = clear speech** (Are my thoughts organized before I speak?)
- **Strategic pausing** (Am I using pauses to access better words?)
- **Strong beginnings and endings** (Do I start and finish sentences with conviction?)
- **Elimination of filler words** (Um, uh, like, you know, so, etc.)
- **Precise word choice** (Am I choosing the most accurate words?)
- **Authentic expression** (Am I being genuine or trying to impress?)

**Step 3: Identify Specific Problems**
For each sentence I spoke, tell me:
- What made it weak or unclear
- Which words were imprecise or unnecessary
- Where I used fillers or weak phrases
- How the sentence structure could be improved

**Step 4: Provide Better Alternatives**
For every problem you identify, show me:
- **What I said:** [exact quote]
- **What I should have said:** [improved version]
- **Why it's better:** [brief explanation]

**Step 5: Give Actionable Improvements**
Focus on practical changes I can make immediately:
- Which filler words to eliminate first
- How to restructure my sentences
- Better word choices for common situations
- Techniques to organize my thoughts before speaking

## **WHAT I WANT FROM YOU:**

- **Be specific** - Don't give general advice, analyze my actual words
- **Be direct** - Point out exactly what's wrong and how to fix it
- **Show alternatives** - For every weakness, give me a better way to say it
- **Focus on patterns** - If I repeat the same mistakes, highlight them
- **Keep it practical** - Give me changes I can implement in my next conversation

## **EXAMPLE OF GOOD FEEDBACK:**

**What you said:** "Um, so like, I think that, you know, this idea is kind of interesting and stuff."

**Problems:** 
- 4 filler words (um, so, like, you know)
- Weak qualifiers (I think, kind of)
- Vague ending (and stuff)
- Multiple ideas crammed together

**Better version:** "This idea is fascinating."

**Why it's better:** One clear idea, strong word choice (fascinating vs interesting), no fillers, confident delivery.

Remember: I want to improve my actual speaking patterns, not learn theory. Analyze what I actually said and show me how to say it better.
`;

// Initialize Google AI File Manager
const fileManager = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, ...body } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });

    const model = google("gemini-2.5-flash-preview-05-20");

    // Check if the request body has video data (file path) for analysis
    const latestMessage = messages[messages.length - 1];
    let processedMessages = messages;

    if (body.filePath) {
      console.log("Processing video analysis request:", body.filePath);

      // Upload file to Google GenAI
      let uploadedFile = await fileManager.files.upload({
        file: body.filePath,
        config: {
          mimeType: body.mimeType || "video/webm",
        },
      });

      console.log("Initial upload state:", uploadedFile.state);

      // Wait for file processing
      while (uploadedFile.state === "PROCESSING") {
        console.log("File is still processing, waiting 1 second...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

      // Replace the latest message content with video attachment
      processedMessages = [
        ...messages.slice(0, -1),
        {
          role: "user",
          content: [
            {
              type: "file",
              data: uploadedFile.uri,
              mimeType: body.mimeType || "video/webm",
            },
            {
              type: "text",
              text: latestMessage.content,
            },
          ],
        },
      ];
    }

    console.log("Starting chat response with Gemini via AI SDK...");

    // Create a stream response using AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 4096,
      temperature: 0.7,
    });

    console.log("Streaming chat response...");

    // Return the stream response in the correct format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({
        error: "Error processing chat request",
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
