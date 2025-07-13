import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get("input")

    if (!input) {
      return NextResponse.json({ predictions: [] })
    }

    // Use NEXT_PUBLIC_GOOGLE_API_KEY for autocomplete
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
    )

    const data = await response.json()

    const predictions =
      data.predictions?.map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
        main_text: prediction.structured_formatting.main_text,
        secondary_text: prediction.structured_formatting.secondary_text,
      })) || []

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("Error in autocomplete API:", error)
    return NextResponse.json({ predictions: [] })
  }
}
