import { generateText } from "ai"
import { openai } from "@ai-sdk/openai" // This import is actually not used for Google models, but kept for now.

export class OpenAIService {
  // Consider renaming this to GenerativeAIService for clarity
  private apiKey: string

  constructor(apiKey: string) {
    // Removed baseUrl parameter
    this.apiKey = apiKey
  }

  async generateVibeDescription(
    placeName: string,
    category: string,
    reviews: string[],
    userProfile: any,
  ): Promise<string> {
    const prompt = `Generate a concise, engaging tagline (max 20 words) for "${placeName}" (${category} category). 
    Consider these user reviews: ${reviews.slice(0, 3).join(". ")}. 
    The user's personality is ${userProfile.personalityType}. 
    Focus on the unique "vibe" of the place. Example: "A cozy cafe perfect for deep conversations."`

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini", {
          // This should ideally be google() if using Gemini
          apiKey: this.apiKey,
        }),
        prompt: prompt,
        temperature: 0.7,
      })
      return text
    } catch (error: any) {
      // Fallback description on error
      return `Experience the unique charm of ${placeName}.`
    }
  }

  async generatePersonalizedEmojis(
    placeName: string,
    category: string,
    userProfile: any,
    reviews: string[],
  ): Promise<string[]> {
    const prompt = `Generate 3-5 emojis that best represent the vibe of "${placeName}" (${category} category). 
    Consider these user reviews: ${reviews.slice(0, 3).join(". ")}. 
    The user's personality is ${userProfile.personalityType}. 
    Return only the emojis, separated by spaces. Example: "☕📚✨"`

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini", {
          // This should ideally be google() if using Gemini
          apiKey: this.apiKey,
        }),
        prompt: prompt,
        temperature: 0.7,
      })
      return text.split(" ").filter(Boolean)
    } catch (error: any) {
      // Fallback emojis on error
      return ["✨", "📍"]
    }
  }
}
