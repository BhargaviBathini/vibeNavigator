import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google" // Import google model from AI SDK

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      userProfile = {}, // Default to empty object for safety
      cityContext = "Unknown city",
      conversationHistory = [],
    } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Ensure the single consolidated Google API key is set
    if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      console.error("NEXT_PUBLIC_GOOGLE_API_KEY environment variable is not set.")
      return NextResponse.json(
        { error: "Server mis-configuration: NEXT_PUBLIC_GOOGLE_API_KEY is missing." },
        { status: 500 },
      )
    }

    /* ------------------------------------------------------------------ */
    /* ----------------------  SAFE DERIVED VALUES  ---------------------- */
    /* ------------------------------------------------------------------ */

    const personality = typeof userProfile.personalityType === "string" ? userProfile.personalityType : "explorer"

    const preferred =
      Array.isArray(userProfile.preferredPlaces) && userProfile.preferredPlaces.length
        ? userProfile.preferredPlaces.slice(0, 3).join(", ")
        : "interesting places"

    /* ------------------------------------------------------------------ */
    /* -------------------------  GEMINI INTEGRATION  -------------------- */
    /* ------------------------------------------------------------------ */

    const systemPrompt = `You are Vibe Navigator AI, an intelligent assistant specializing in travel and local discovery.
The user's personality is ${personality}, and they love places like ${preferred}.
The current city is ${cityContext}. Be helpful, engaging, and concise.`

    // Map conversation history to AI SDK message format, excluding the system prompt from this array
    const messagesForAI = [
      ...conversationHistory.map((m: any) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: String(m.content),
      })),
      { role: "user", content: message },
    ]

    const { text } = await generateText({
      model: google("models/gemini-1.5-flash-latest", {
        // Using Gemini Flash Lite model
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY, // Use the consolidated key
      }),
      system: systemPrompt, // Pass system prompt separately
      messages: messagesForAI, // Pass the conversation history
      temperature: 0.7,
    })

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error("Error in chat API:", error)
    let errorMessage = "Unexpected server error during AI generation."
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
      // Check for specific AI SDK error properties if available
      if ("status" in error && typeof error.status === "number") {
        statusCode = error.status
      }
    } else if (typeof error === "object" && error !== null) {
      // Attempt to stringify complex error objects for better logging
      try {
        errorMessage = JSON.stringify(error)
      } catch (e) {
        errorMessage = String(error) // Fallback if stringify fails
      }
    } else {
      errorMessage = String(error)
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
