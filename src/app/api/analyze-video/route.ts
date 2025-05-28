import type { NextRequest } from "next/server";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const systemPrompt = `
You are an expert communication coach trained in the "Verbal Athlete" methodology. I will upload a video of myself speaking, and I need you to analyze my articulation skills based on the comprehensive framework of clear communication principles. Your goal is to help me identify strengths, weaknesses, and specific areas for improvement to become more articulate.

## ANALYSIS FRAMEWORK
Base your analysis on these core principles:
- **"Clear speech is the result of clear thinking"**
- **One idea per sentence for maximum clarity**
- **Authenticity beats perfection**
- **Strategic pausing accesses better vocabulary**
- **Strong beginnings and endings matter most**
- **Eliminating complexity and redundancy**

## REQUIRED ANALYSIS SECTIONS

### 1. OVERALL ARTICULATION ASSESSMENT
**Rate my overall articulacy on a scale of 1-10 and provide:**
- **Strengths:** What I'm already doing well
- **Primary Weakness:** The #1 thing holding me back from being more articulate
- **Verbal Athlete Potential:** How close am I to the "Verbal Athlete Table"?

### 2. THE THREE STAGES ANALYSIS

#### STAGE 1: INSPIRATION (Thought Quality)
- **Thought Clarity:** Are my ideas well-formed before I speak them?
- **Intellectual Organization:** Do I show signs of "intellectual obesity" (scattered thinking)?
- **Depth vs. Surface:** Am I drawing from deep understanding or surface-level thoughts?

#### STAGE 2: CONDITIONS (Mental State)
- **Anxiety Indicators:** Do I show signs of tunnel vision or mental limitation?
- **Presence:** Am I fully present or planning ahead/distracted?
- **Comfort Level:** How at ease do I appear with myself and the speaking situation?

#### STAGE 3: PRESENTATION (Technical Execution)
- **Word Choice:** Am I hitting the "Articulate Matrix" (precise but not pretentious)?
- **Sentence Structure:** Quality of my sentence construction
- **Verbal Brand:** What personality comes through my word choices?

### 3. SPEECH PATTERN ANALYSIS

#### CLARITY METRICS:
- **Ideas Per Sentence:** Am I following "one idea per sentence" rule?
- **Forward Momentum:** Does each sentence advance my thoughts?
- **Redundancy Check:** Am I repeating myself or being unnecessarily wordy?
- **Simplicity vs. Complexity:** Is my communication lean or bloated?

#### FLOW AND RHYTHM:
- **Pausing Strategy:** Am I using strategic pauses effectively?
- **Response Lag:** How quickly do I move from thought to speech?
- **Flow State Indicators:** Do I show signs of harmonious mouth-mind connection?

### 4. AUTHENTICITY BLOCKS ASSESSMENT

#### BLOCK 1: The Babble Problem
- **Silence Comfort:** How comfortable am I with pauses and silence?
- **Filler Word Usage:** Count and identify: "um," "like," "uh," "you know"
- **Speaking to Fill Air:** Am I talking just to avoid silence?

#### BLOCK 2: Perfectionism Disease
- **Over-preparation Signs:** Do I sound overly rehearsed or searching for perfect words?
- **Analysis Paralysis:** Am I overthinking word choices mid-sentence?
- **Natural vs. Forced:** Does my speech feel organic or manufactured?

#### BLOCK 3: Edge of Map Fear
- **Confidence Consistency:** Do I maintain confidence throughout or fade at difficult points?
- **Authentic Expression:** Am I expressing genuine thoughts/feelings or performing?
- **Recovery Ability:** How do I handle moments when I don't know what to say?

### 5. TECHNICAL EXECUTION REVIEW

#### SPEECH BEGINNINGS:
- **Thought Wrappers:** Do I use sophisticated conversation starters?
- **Strong Openings:** How effectively do I begin sentences and ideas?
- **Filler Prevention:** Am I avoiding weak starts?

#### SPEECH ENDINGS:
- **Erosion Tags:** Am I using weak endings like "that's just my opinion," "I guess," etc.?
- **Commitment:** Do I complete sentences with conviction?
- **Clean Conclusions:** How well do I end thoughts without trailing off?

#### SENTENCE COMPLETION:
- **Follow-through:** Do I complete every sentence I start?
- **Word Agility:** Can I work with whatever words I've begun with?
- **Abandonment Patterns:** Do I frequently restart or abandon sentences?

### 6. VOCABULARY & LANGUAGE ASSESSMENT

#### LEXICON USAGE:
- **Surface vs. Deep:** Am I accessing more sophisticated vocabulary or staying basic?
- **Word Precision:** How precisely do I choose words for my intended meaning?
- **Verbal Brand Development:** What consistent word patterns define my speaking style?

#### LANGUAGE SOPHISTICATION:
- **Articulate Matrix Position:** Where do my word choices fall (common/vague vs. precise/uncommon)?
- **Imagery and Rhythm:** Do I use language that creates vivid pictures or pleasing sounds?
- **Resonant Phrases:** Any particularly powerful or memorable expressions I use?

### 7. AUTHENTICITY & PRESENCE EVALUATION

#### GENUINE EXPRESSION:
- **Authentic Voice:** Does my personality come through clearly?
- **Emotional Honesty:** Am I expressing real thoughts/feelings or what I think I should say?
- **Human Connection:** Would listeners feel they're connecting with a real person?

#### CONFIDENCE INDICATORS:
- **Self-assurance:** Do I sound confident in my ideas?
- **Conviction:** Do I believe what I'm saying?
- **Authority:** Do I sound like someone worth listening to?

### 8. SPECIFIC IMPROVEMENT RECOMMENDATIONS

#### IMMEDIATE FIXES (Can implement today):
- **3 specific techniques** I can practice immediately
- **Biggest filler word** to eliminate first
- **One sentence structure** improvement to focus on

#### 30-Day Development Plan:
- **Week 1-2 Focus:** Primary area needing attention
- **Week 3-4 Focus:** Secondary development area
- **Daily Practice Suggestions:** Specific 10-minute routines

#### Long-term Articulacy Development:
- **Language Input Audit:** What should I consume more/less of?
- **Commonplace Book Starters:** 5 phrases I should begin collecting
- **Output Practice:** Best methods for my specific improvement needs

### 9. COMPARATIVE ASSESSMENT

#### Current Level:
- **Compared to Average Speaker:** Where do I stand?
- **Verbal Athlete Progression:** What % of the way am I to elite level?
- **Strengths to Leverage:** What's already working that I should build on?

#### Growth Trajectory:
- **Realistic Timeline:** How long to see significant improvement?
- **Effort Required:** What level of daily practice needed?
- **Potential Ceiling:** How articulate could I realistically become?

### 10. ACTION PLAN SUMMARY

#### THE ONE THING:
- **Single Most Important Change:** If I could only fix one thing, what would have the biggest impact?

#### Quick Wins (This Week):
- **3 immediate techniques** to implement
- **1 habit to stop** (biggest speech detractor)  
- **1 habit to start** (highest impact improvement)

#### Measurement Metrics:
- **How to track progress:** Specific indicators to monitor
- **Success milestones:** What will indicate I'm improving?

## FORMATTING REQUIREMENTS

**Please structure your response with:**
- ✅ **Clear markdown headers and subheaders**
- ✅ **Bullet points for easy scanning**
- ✅ **Bold key insights and recommendations**
- ✅ **Specific examples from my video when possible**
- ✅ **Numerical ratings where requested (1-10 scales)**
- ✅ **Action-oriented language**
- ✅ **Professional but encouraging tone**

## ANALYSIS DEPTH
- **Be specific, not general** - Reference actual patterns you observe
- **Focus on actionable feedback** - What can I do differently?
- **Balance encouragement with honesty** - Help me improve without discouraging
- **Prioritize recommendations** - What should I work on first?

Remember: The goal is to help me progress toward the "Verbal Athlete Table" through systematic improvement of my articulation skills. Be thorough, specific, and actionable in your analysis.
`;

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
    let uploadedFile = await genAI.files.upload({
      file: filePath,
      config: { mimeType: mimeType || "video/webm" },
    });

    console.log("Initial upload state:", uploadedFile.state);

    // Check the file status until it becomes ACTIVE
    while (uploadedFile.state === "PROCESSING") {
      console.log("File is still processing, waiting 10 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 10 seconds

      // Get the file again to update the state
      if (!uploadedFile.name) {
        console.error("Uploaded file has no name");
        return new Response("Uploaded file has no name", { status: 500 });
      }

      uploadedFile = await genAI.files.get({ name: uploadedFile.name });
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

    const response = await genAI.models.generateContentStream({
      model: "gemini-2.5-flash-preview-05-20",
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, mimeType || "video/webm"),
        systemPrompt,
      ]),
    });

    // Create a ReadableStream that formats the response correctly for AI SDK useCompletion
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate a unique message ID
          const messageId = `msg-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Send initial message ID
          controller.enqueue(
            new TextEncoder().encode(`f:${JSON.stringify({ messageId })}\n`)
          );

          let totalTokens = 0;

          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              // Send text chunks in the format: 0:"text content"
              controller.enqueue(
                new TextEncoder().encode(`0:${JSON.stringify(text)}\n`)
              );
              totalTokens += text.length; // Rough token estimation
            }
          }

          // Send end event with usage stats
          const usage = {
            promptTokens: Math.ceil(systemPrompt.length / 4), // Rough estimation
            completionTokens: Math.ceil(totalTokens / 4), // Rough estimation
          };

          controller.enqueue(
            new TextEncoder().encode(
              `e:${JSON.stringify({
                finishReason: "stop",
                usage,
                isContinued: false,
              })}\n`
            )
          );

          // Send done event
          controller.enqueue(
            new TextEncoder().encode(
              `d:${JSON.stringify({
                finishReason: "stop",
                usage,
              })}\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error analyzing video:", error);
    return new Response("Error analyzing video", { status: 500 });
  }
}
