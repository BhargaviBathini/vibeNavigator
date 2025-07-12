interface PlacePhoto {
  photo_reference: string
  height: number
  width: number
}

interface PlaceResult {
  place_id: string
  name: string
  rating?: number
  price_level?: number
  vicinity: string
  formatted_address?: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  photos?: PlacePhoto[]
  opening_hours?: {
    open_now: boolean
    weekday_text?: string[]
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
  }
  types: string[]
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
    profile_photo_url?: string
  }>
  website?: string
  formatted_phone_number?: string
  international_phone_number?: string
}

interface PlacesResponse {
  results: PlaceResult[]
  status: string
  next_page_token?: string
}

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance: { text: string; value: number }
      duration: { text: string; value: number }
      status: string
    }>
  }>
  status: string
}

export class GooglePlacesService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchPlaces(
    query: string, // This is the keyword for nearby search
    location: string, // This is the city/address string for geocoding if userLocation is not provided
    type?: string, // Google Places type filter
    userLocation?: { lat: number; lng: number; address?: string; city?: string }, // Updated type to accept full object
  ): Promise<PlaceResult[]> {
    try {
      let searchLat: number, searchLng: number

      if (userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number") {
        searchLat = userLocation.lat
        searchLng = userLocation.lng
      } else {
        // Geocode the location string if userLocation is not provided or incomplete
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${this.apiKey}`,
        )
        const geocodeData = await geocodeResponse.json()

        if (geocodeData.status !== "OK" || !geocodeData.results.length) {
          return [] // Return empty array if geocoding fails
        }

        const coords = geocodeData.results[0].geometry.location
        searchLat = coords.lat
        searchLng = coords.lng
      }

      // Search for places using nearbysearch
      const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      searchUrl.searchParams.set("location", `${searchLat},${searchLng}`)
      searchUrl.searchParams.set("radius", "10000") // 10km radius
      searchUrl.searchParams.set("key", this.apiKey)

      if (type) {
        searchUrl.searchParams.set("type", type)
      }
      if (query) {
        searchUrl.searchParams.set("keyword", query)
      }

      const response = await fetch(searchUrl.toString())
      const data: PlacesResponse = await response.json()

      if (data.status !== "OK") {
        return [] // Return empty array if Places API returns non-OK status
      }

      return data.results
    } catch (error) {
      return [] // Return empty array on any error during search
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const fields = [
        "name",
        "rating",
        "formatted_phone_number",
        "international_phone_number",
        "opening_hours",
        "website",
        "reviews",
        "photos",
        "formatted_address",
        "geometry",
        "price_level",
        "types",
      ].join(",")

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`,
      )
      const data = await response.json()

      if (data.status === "OK") {
        return data.result
      }
      return null // Return null if details cannot be fetched
    } catch (error) {
      return null // Return null on any error during detail fetching
    }
  }

  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>,
  ): Promise<DistanceMatrixResponse | null> {
    try {
      // Ensure only lat and lng are used for origins
      const originsStr = origins.map((o) => `${o.lat},${o.lng}`).join("|")
      const destinationsStr = destinations.map((d) => `${d.lat},${d.lng}`).join("|")

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&units=metric&key=${this.apiKey}`,
      )
      return await response.json()
    } catch (error) {
      return null // Return null on error
    }
  }

  async getPlaceAutocomplete(input: string, types = "(cities)"): Promise<any[]> {
    try {
      if (input.length < 2) return []

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=${types}&key=${this.apiKey}`,
      )
      const data = await response.json()

      return (
        data.predictions?.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text,
          types: prediction.types,
        })) || []
      )
    } catch (error) {
      return [] // Return empty array on error
    }
  }

  getPhotoUrl(photoReference: string, maxWidth = 400): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`
  }

  getDirectionsUrl(destination: { lat: number; lng: number }, origin?: { lat: number; lng: number }): string {
    const baseUrl = "https://www.google.com/maps/dir/"
    if (origin) {
      return `${baseUrl}${origin.lat},${origin.lng}/${destination.lat},${destination.lng}`
    }
    return `${baseUrl}/${destination.lat},${destination.lng}`
  }
}
