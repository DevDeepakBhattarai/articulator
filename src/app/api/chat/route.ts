import type { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { db } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  try {
    const { messages, chatSessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    if (!chatSessionId) {
      return new Response("Chat session ID is required", { status: 400 });
    }

    // Verify chat session exists
    const chatSession = await db.chatSession.findUnique({
      where: { id: chatSessionId },
    });

    if (!chatSession) {
      return new Response("Chat session not found", { status: 404 });
    }

    // Save user message to database if it's a new message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      await db.message.create({
        data: {
          chatSessionId,
          role: "user",
          content: lastMessage.content,
        },
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });

    const model = google("gemini-2.5-flash-preview-05-20");

    console.log("Starting chat response with Gemini via AI SDK...");

    // Create a stream response using AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      maxTokens: 4096,
      temperature: 0.7,
      async onFinish({ text }) {
        // Save assistant message to database
        try {
          await db.message.create({
            data: {
              chatSessionId,
              role: "assistant",
              content: text,
            },
          });
          console.log("Assistant message saved to database");
        } catch (error) {
          console.error("Error saving assistant message:", error);
        }
      },
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
