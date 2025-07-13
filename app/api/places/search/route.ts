import { type NextRequest, NextResponse } from "next/server"
import { GooglePlacesService } from "@/lib/google-places"
import { OpenAIService } from "@/lib/openai-service" // This service name is misleading, it's used for Google AI
import { ScrapingService } from "@/lib/scraping-service"

// Instantiate services with the single NEXT_PUBLIC_GOOGLE_API_KEY
const placesService = new GooglePlacesService(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)
const aiService = new OpenAIService(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!) // Renamed from openaiService for clarity
const scrapingService = new ScrapingService()

// Category mapping for Google Places API
const categoryMapping: Record<string, string> = {
  cafes: "cafe",
  parks: "park",
  historical: "tourist_attraction",
  religious: "place_of_worship",
  nature: "natural_feature",
  museums: "museum",
  shopping: "shopping_mall",
  adventure: "amusement_park",
  beaches: "natural_feature",
  nightlife: "night_club",
  bookstores: "book_store",
  viewpoints: "tourist_attraction",
}

export async function POST(request: NextRequest) {
  try {
    const { city, category, userProfile, userLocation } = await request.json()

    if (!city || !category) {
      return NextResponse.json({ error: "City and category are required" }, { status: 400 })
    }

    // Determine the coordinates to use for the primary place search.
    // If user's precise location is available AND the search city matches the detected city,
    // use the precise coordinates for the search origin.
    // Otherwise, the GooglePlacesService will geocode the 'city' string.
    let searchOriginForGooglePlacesService: { lat: number; lng: number } | undefined = undefined
    if (
      userLocation &&
      userLocation.lat &&
      userLocation.lng &&
      userLocation.city &&
      userLocation.city.toLowerCase() === city.toLowerCase()
    ) {
      searchOriginForGooglePlacesService = { lat: userLocation.lat, lng: userLocation.lng }
    }

    // The 'city' string is always passed as the 'location' parameter to searchPlaces.
    // If searchOriginForGooglePlacesService is defined, GooglePlacesService will use those precise coordinates.
    // If it's undefined, GooglePlacesService will internally geocode the 'city' string to get coordinates for the search.
    const googleType = categoryMapping[category] || "establishment"
    const places = await placesService.searchPlaces("", city, googleType, searchOriginForGooglePlacesService)

    if (places.length === 0) {
      return NextResponse.json({
        places: [],
        total: 0,
        message: "No places found for this category in the specified location",
      })
    }

    // For distance matrix calculation, always use the user's precise location if available.
    let distanceMatrix = null
    const preciseUserCoordsForDistance = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
    if (preciseUserCoordsForDistance) {
      const destinations = places.slice(0, 10).map((p) => p.geometry.location)
      distanceMatrix = await placesService.getDistanceMatrix([preciseUserCoordsForDistance], destinations)
      // Error/warning handling for distance matrix is internal to google-places.ts
    }

    // Process each place to add vibe data
    const processedPlaces = await Promise.all(
      places.slice(0, 8).map(async (place, index) => {
        try {
          // Get detailed place information from Google Places API
          const placeDetails = await placesService.getPlaceDetails(place.place_id)
          if (!placeDetails) {
            return null // Skip this place if details cannot be fetched
          }

          // Initialize data with Google Places details
          const website = placeDetails?.website
          const phone = placeDetails?.formatted_phone_number || placeDetails?.international_phone_number
          const googleReviews = placeDetails?.reviews || []

          // Conditionally scrape for missing information
          let scrapedDescription = ""
          let additionalScrapedWebsite: string | undefined
          let additionalScrapedPhone: string | undefined

          if (!website || !phone || googleReviews.length === 0) {
            const scrapedData = await scrapingService.scrapeAdditionalPlaceData(
              place.name,
              placeDetails?.formatted_address || place.vicinity,
            )
            if (!website) additionalScrapedWebsite = scrapedData.website
            if (!phone) additionalScrapedPhone = scrapedData.phone
            scrapedDescription = scrapedData.description || "" // Use scraped description if available
          }

          // Always try to scrape reviews for more variety for AI, combine with Google reviews
          const additionalScrapedReviews = await scrapingService.scrapeReviewsForVibe(place.name, category)
          const allReviewsText = [...googleReviews.map((r) => r.text), ...additionalScrapedReviews].filter(
            Boolean,
          ) as string[]

          // Generate AI-powered vibe content using the consolidated AI service
          const [vibeDescription, personalizedEmojis] = await Promise.all([
            aiService.generateVibeDescription(place.name, category, allReviewsText, userProfile),
            aiService.generatePersonalizedEmojis(place.name, category, userProfile, allReviewsText),
          ])

          // Calculate distance and travel time
          let distance = "Distance unavailable"
          let travelTime = "Time unavailable"

          if (distanceMatrix && distanceMatrix.rows[0]?.elements[index]) {
            const element = distanceMatrix.rows[0].elements[index]
            if (element.status === "OK") {
              distance = element.distance.text
              travelTime = element.duration.text
            }
          }

          // Calculate vibe score
          const vibeScore = calculateVibeScore(place, userProfile, allReviewsText, placeDetails)

          // Format working days and opening hours
          const workingDays = placeDetails?.opening_hours?.weekday_text || []
          const openingHours =
            workingDays.length > 0 ? workingDays[new Date().getDay()] || "Hours not available" : "Hours not available"

          return {
            id: place.place_id,
            name: place.name,
            category: category,
            rating: place.rating || 4.0,
            distance,
            travelTime,
            image: place.photos?.[0]
              ? placesService.getPhotoUrl(place.photos[0].photo_reference, 600)
              : "/placeholder.svg?height=300&width=400",
            vibeScore,
            tags: generatePersonalizedTags(place, userProfile, allReviewsText),
            description: vibeDescription, // This is the AI-generated tagline
            vibeDescription: vibeDescription, // Detailed AI-generated vibe description
            personalizedEmojis, // Include personalized emojis
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            address: placeDetails?.formatted_address || place.vicinity,
            openingHours,
            workingDays,
            website: website || additionalScrapedWebsite, // Prioritize Google, then scraped
            phone: phone || additionalScrapedPhone, // Prioritize Google, then scraped
            priceLevel: place.price_level,
            reviews:
              googleReviews.map((review) => ({
                id: `${place.place_id}_${review.time}`,
                author: review.author_name,
                rating: review.rating,
                text: review.text,
                time: new Date(review.time * 1000).toLocaleDateString(),
                profilePhoto: review.profile_photo_url,
              })) || [],
            isFavorite: false,
          }
        } catch (error) {
          console.error(`Error processing place ${place.name}:`, error)
          // If processing a single place fails, return null so it's filtered out
          return null
        }
      }),
    )

    const validPlaces = processedPlaces.filter((place) => place !== null)

    // Sort by vibe score descending
    validPlaces.sort((a, b) => (b?.vibeScore || 0) - (a?.vibeScore || 0))

    return NextResponse.json({
      places: validPlaces,
      total: validPlaces.length,
      userLocation: userLocation || null,
    })
  } catch (error) {
    console.error("Error in places search API:", error)
    return NextResponse.json({ error: "Internal server error during place search" }, { status: 500 })
  }
}

function calculateVibeScore(place: any, userProfile: any, reviews: string[], placeDetails?: any): number {
  let score = 60 // Base score

  // Rating boost (0-20 points)
  if (place.rating) {
    score += Math.min(20, (place.rating - 3) * 10)
  }

  // Personality type matching (0-15 points)
  const personalityKeywords: Record<string, string[]> = {
    Adventurous: ["adventure", "exciting", "thrilling", "outdoor", "active"],
    Chill: ["peaceful", "quiet", "relaxing", "calm", "serene", "cozy"],
    Curious: ["unique", "interesting", "educational", "cultural", "historical"],
    Spiritual: ["peaceful", "serene", "mindful", "quiet", "sacred"],
    Creative: ["artistic", "aesthetic", "inspiring", "beautiful", "creative"],
    Social: ["lively", "popular", "vibrant", "social", "buzzing"],
  }

  const keywords = personalityKeywords[userProfile.personalityType] || []
  const reviewText = reviews.join(" ").toLowerCase()
  const placeTypes = place.types?.join(" ").toLowerCase() || ""

  let keywordMatches = 0
  keywords.forEach((keyword) => {
    if (reviewText.includes(keyword) || placeTypes.includes(keyword)) {
      keywordMatches++
    }
  })
  score += Math.min(15, keywordMatches * 3)

  // Price level matching (0-10 points)
  if (place.price_level !== undefined) {
    // Assume users prefer moderate pricing (level 2-3)
    const pricePenalty = Math.abs(place.price_level - 2) * 2
    score -= pricePenalty
  }

  // Review quality boost (0-10 points)
  // Use the combined reviews for this calculation
  if (reviews && reviews.length > 0) {
    // This is a simplified approach as we don't have individual ratings for scraped reviews.
    // We'll just use the count of reviews as a proxy for "quality" or popularity.
    score += Math.min(10, reviews.length * 2)
  }

  // Opening hours availability (0-5 points)
  if (placeDetails?.opening_hours?.open_now) {
    score += 5
  }

  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, Math.round(score)))
}

function generatePersonalizedTags(place: any, userProfile: any, reviews: string[]): string[] {
  const baseTags = []

  // Add personality-based tags
  const personalityTags: Record<string, string[]> = {
    Adventurous: ["exciting", "adventure-ready"],
    Chill: ["relaxing", "peaceful"],
    Curious: ["fascinating", "educational"],
    Spiritual: ["mindful", "serene"],
    Creative: ["inspiring", "aesthetic"],
    Social: ["vibrant", "social-hub"],
  }

  baseTags.push(...(personalityTags[userProfile.personalityType] || []))

  // Add rating-based tags
  if (place.rating >= 4.5) baseTags.push("highly-rated")
  if (place.rating >= 4.0) baseTags.push("popular")

  // Add review-based tags
  const reviewText = reviews.join(" ").toLowerCase()
  if (reviewText.includes("cozy")) baseTags.push("cozy")
  if (reviewText.includes("beautiful")) baseTags.push("beautiful")
  if (reviewText.includes("friendly")) baseTags.push("friendly-staff")
  if (reviewText.includes("clean")) baseTags.push("well-maintained")
  if (reviewText.includes("unique")) baseTags.push("unique-find")
  if (reviewText.includes("hidden gem")) baseTags.push("hidden-gem")

  return Array.from(new Set(baseTags)).slice(0, 4) // Limit to 4 unique tags
}
