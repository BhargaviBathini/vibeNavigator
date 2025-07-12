export interface UserProfile {
  id: string
  name: string
  age: number
  personalityType: "Adventurous" | "Chill" | "Curious" | "Spiritual" | "Creative" | "Social"
  travelCompanion: "Solo" | "Friends" | "Partner" | "Family"
  preferredPlaces: string[]
  createdAt: Date
  currentLocation?: {
    lat: number
    lng: number
    address: string
    city: string // Added city here for consistency
  }
}

export interface PlaceCategory {
  id: string
  name: string
  emoji: string
  tags: string[]
  vibe: string[]
  description: string
}

export interface VibePlace {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  travelTime: string
  image: string
  vibeScore: number
  tags: string[]
  description: string
  coordinates: { lat: number; lng: number }
  address: string
  openingHours?: string
  workingDays?: string[]
  website?: string
  phone?: string
  priceLevel?: number
  reviews?: PlaceReview[]
  vibeDescription?: string
  personalizedEmojis?: string[]
  isFavorite?: boolean
}

export interface PlaceReview {
  id: string
  author: string
  rating: number
  text: string
  time: string
  profilePhoto?: string
}

export interface UserReview {
  id: string
  placeId: string
  placeName: string
  rating: number
  text: string
  createdAt: Date
  images?: string[]
}

export interface FavoritePlace {
  id: string
  place: VibePlace
  addedAt: Date
  notes?: string
}

export interface LocationPrediction {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
  types: string[]
}
