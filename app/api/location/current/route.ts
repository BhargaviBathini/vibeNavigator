import { type NextRequest, NextResponse } from "next/server"
import { GooglePlacesService } from "@/lib/google-places"

// Instantiate GooglePlacesService with the single NEXT_PUBLIC_GOOGLE_API_KEY
const googlePlacesService = new GooglePlacesService(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    let data
    try {
      // Use NEXT_PUBLIC_GOOGLE_API_KEY for reverse geocoding
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
      )
      data = await response.json()
    } catch (err) {
      data = { status: "ERROR", error_message: String(err) }
    }

    if (data.status !== "OK") {
      // Gracefully downgrade – never send a 500
      return NextResponse.json({
        lat,
        lng,
        address: "Unknown address",
        city: "Unknown City",
        warning: `Reverse-geocode failed: ${data.status}. ${data.error_message || ""}`,
      })
    }

    const results = data.results
    let city = "Unknown City"
    const address = results[0]?.formatted_address || "Unknown address"

    if (results && results.length > 0) {
      const addressComponents = results[0].address_components
      // Prioritize locality (city), then administrative_area_level_1 (state), then administrative_area_level_2 (county/district)
      const locality = addressComponents.find((c: any) => c.types.includes("locality"))?.long_name
      const adminArea1 = addressComponents.find((c: any) => c.types.includes("administrative_area_level_1"))?.long_name
      const adminArea2 = addressComponents.find((c: any) => c.types.includes("administrative_area_level_2"))?.long_name

      city = locality || adminArea1 || adminArea2 || "Unknown City"
    }

    return NextResponse.json({
      lat,
      lng,
      address,
      city,
    })
  } catch (error) {
    // Return 200 OK with a warning and default values on internal server error
    return NextResponse.json({
      lat: null,
      lng: null,
      address: "Unknown address",
      city: "Unknown City",
      warning: "Internal server error during geocoding. Please try again.",
    })
  }
}
