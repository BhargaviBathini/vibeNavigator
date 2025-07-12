"use client"

import { useState, useEffect, useRef } from "react"
import { useProfileStore } from "@/lib/store"
import { placeCategories } from "@/lib/categories"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  MapPin,
  Clock,
  Star,
  Navigation,
  ImageIcon,
  Loader2,
  Heart,
  Info,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import GoogleMaps from "./google-maps"

interface Place {
  id: string
  name: string
  category: string
  rating: number
  distance: string
  travelTime: string
  image: string
  vibeScore: number
  tags: string[]
  description: string // AI-generated tagline
  vibeDescription: string // AI-generated detailed vibe description
  personalizedEmojis: string[]
  coordinates: { lat: number; lng: number }
  address: string
  openingHours?: string // Current day's opening hours
  workingDays?: string[] // All working days
  website?: string
  phone?: string
  priceLevel?: number
  reviews?: Array<{
    id: string
    author: string
    rating: number
    text: string
    time: string
    profilePhoto?: string
  }>
  isFavorite?: boolean
}

interface LocationPrediction {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
  types: string[]
}

export default function VibeSearch() {
  const {
    profile,
    currentCity,
    selectedCategory,
    userLocation,
    setCurrentCity,
    setSelectedCategory,
    setUserLocation,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    addReview,
    getReviewsForPlace,
  } = useProfileStore()

  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState(currentCity)
  const [viewMode, setViewMode] = useState<"info" | "vibe">("info")
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [locationPredictions, setLocationPredictions] = useState<LocationPrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [sortOrder, setSortOrder] = useState<"vibeScore" | "rating" | "distance">("vibeScore")
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-detect user location on component mount
  useEffect(() => {
    if (!userLocation && profile) {
      console.log("useEffect: userLocation is null and profile exists. Attempting to detect location.")
      detectCurrentLocation()
    } else if (userLocation) {
      console.log("useEffect: userLocation already set:", userLocation.city)
    } else {
      console.log("useEffect: Profile not loaded or userLocation already set.")
    }
  }, [profile, userLocation])

  // Fetch location predictions for autocomplete
  const fetchLocationPredictions = async (input: string) => {
    if (input.length < 2) {
      setLocationPredictions([])
      return
    }

    try {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}&types=geocode`)
      const data = await response.json()
      setLocationPredictions(data.predictions || [])
    } catch (error) {
      toast({
        title: "Autocomplete failed",
        description: "Could not fetch location suggestions.",
        variant: "destructive",
      })
    }
  }

  // Debounced location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery !== currentCity) {
        fetchLocationPredictions(searchQuery)
        setShowPredictions(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, currentCity])

  const detectCurrentLocation = async () => {
    console.log("detectCurrentLocation function called.")
    setGettingLocation(true)
    try {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported by your browser.")
        throw new Error("Geolocation not supported by your browser.")
      }

      console.log("Calling navigator.geolocation.getCurrentPosition...")
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log("Geolocation success callback triggered:", pos)
            resolve(pos)
          },
          (err) => {
            console.error("Geolocation error callback triggered:", err)
            reject(err)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          },
        )
      })

      const { latitude, longitude } = position.coords
      console.log(`Detected coordinates: Lat ${latitude}, Lng ${longitude}`)

      // Call server-side API to get location details (address and city)
      const response = await fetch("/api/location/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      })

      const locationData = await response.json()
      if (!response.ok) {
        console.warn("Server returned non-OK status, falling back with payload:", locationData)
      }

      console.log("Location data from server:", locationData)

      // Ensure all properties are present, even if with fallback values
      const newLocation = {
        lat: latitude,
        lng: longitude,
        address: locationData.address || "Unknown address",
        city: locationData.city || "Unknown City",
      }

      setUserLocation(newLocation) // Update the store with the full location object
      setCurrentCity(newLocation.city) // Also update currentCity for the search bar display
      setSearchQuery(newLocation.city) // Set search input to the detected city

      toast({
        title:
          locationData.warning || newLocation.city === "Unknown City"
            ? "Approximate location 📍"
            : "Location detected! 📍",
        description: locationData.warning || `Found you in ${newLocation.city}`,
      })

      // If a category is already selected, trigger a search with the newly detected location
      if (selectedCategory) {
        console.log("Selected category exists, triggering search with new location.")
        await searchPlaces(newLocation.city, selectedCategory, newLocation) // Pass the full newLocation object
      }
    } catch (error: any) {
      console.error("Error detecting location (caught):", error) // Log the full error object for debugging
      let errorMessage = "Please ensure location services are enabled and try again."
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location permissions in your browser settings."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Try again later."
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out. Try again."
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      toast({
        title: "Location detection failed",
        description: errorMessage,
        variant: "destructive",
      })
      setUserLocation(null) // Explicitly reset userLocation on failure to allow re-trigger
    } finally {
      setGettingLocation(false)
      console.log("detectCurrentLocation function finished.")
    }
  }

  const handleLocationSelect = (location: LocationPrediction) => {
    setSearchQuery(location.main_text)
    setCurrentCity(location.main_text)
    setShowPredictions(false)
    setLocationPredictions([])
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a location",
        variant: "destructive",
      })
      return
    }

    setCurrentCity(searchQuery) // Update store with the typed city
    setShowPredictions(false)

    if (selectedCategory) {
      // When user types and searches, we pass userLocation if available.
      // The backend will use it for distance calculation, otherwise geocode the city string.
      await searchPlaces(searchQuery, selectedCategory, userLocation)
    }
  }

  // Modified client-side searchPlaces function signature
  const searchPlaces = async (
    cityToSearch: string,
    category: string,
    locationCoords: { lat: number; lng: number; address: string; city: string } | null,
  ) => {
    if (!profile) return

    setLoading(true)
    try {
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityToSearch, // Use the city string passed to this function
          category,
          userProfile: profile,
          userLocation: locationCoords, // Pass userLocation if available
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to search places")
      }

      const data = await response.json()
      const placesWithFavorites = data.places.map((place: Place) => ({
        ...place,
        isFavorite: isFavorite(place.id),
      }))

      setPlaces(placesWithFavorites)

      toast({
        title: `Found ${data.places?.length || 0} places! ✨`,
        description: `Showing ${placeCategories.find((c) => c.id === category)?.name} in ${cityToSearch}`,
      })
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (currentCity) {
      // Always pass userLocation if available. Backend will decide whether to use it for distance.
      await searchPlaces(currentCity, categoryId, userLocation)
    }
  }

  const handleFavoriteToggle = (place: Place) => {
    if (isFavorite(place.id)) {
      removeFromFavorites(place.id)
      toast({ title: "Removed from favorites" })
    } else {
      addToFavorites(place)
      toast({ title: "Added to favorites! ❤️" })
    }

    // Update local state
    setPlaces((prev) => prev.map((p) => (p.id === place.id ? { ...p, isFavorite: !p.isFavorite } : p)))
  }

  const handleAddReview = (place: Place) => {
    if (!reviewText.trim()) {
      toast({ title: "Please write a review", variant: "destructive" })
      return
    }

    addReview({
      placeId: place.id,
      placeName: place.name,
      rating: reviewRating,
      text: reviewText.trim(),
    })

    setReviewText("")
    setReviewRating(5)
    setSelectedPlace(null) // Close the dialog

    toast({ title: "Review added! 🌟", description: "Thank you for sharing your experience" })
  }

  const handleSharePlace = async (place: Place) => {
    // Construct a shareable URL for the place. This would ideally link to a specific place page.
    // For now, we'll use a placeholder. You might want to implement dynamic routing for /place/[id].
    const shareUrl = `${window.location.origin}/dashboard?tab=search&placeId=${place.id}`
    const shareText = `Check out ${place.name} - a place with ${place.vibeScore}% vibe match! "${place.description}"`

    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: shareText,
          url: shareUrl,
        })
        toast({ title: "Place shared successfully!" })
      } catch (error) {
        toast({ title: "Failed to share place", description: "Please try again.", variant: "destructive" })
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast({ title: "Link copied to clipboard!", description: "You can paste it anywhere to share." })
      } catch (error) {
        toast({ title: "Failed to copy link", description: "Please try again.", variant: "destructive" })
      }
    }
  }

  const getDirectionsUrl = (place: Place) => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${place.coordinates.lat},${place.coordinates.lng}`
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`
  }

  const getPriceDisplay = (priceLevel?: number) => {
    if (!priceLevel) return "Price not available"
    return "₹".repeat(priceLevel) + "₹".repeat(4 - priceLevel).replace(/₹/g, "○")
  }

  const sortedPlaces = [...places].sort((a, b) => {
    let comparison = 0
    if (sortOrder === "vibeScore") {
      comparison = (a.vibeScore || 0) - (b.vibeScore || 0)
    } else if (sortOrder === "rating") {
      comparison = (a.rating || 0) - (b.rating || 0)
    } else if (sortOrder === "distance") {
      // Assuming distance is like "1.2 km"
      const distA = Number.parseFloat(a.distance.split(" ")[0]) || Number.POSITIVE_INFINITY
      const distB = Number.parseFloat(b.distance.split(" ")[0]) || Number.POSITIVE_INFINITY
      comparison = distA - distB
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="vibe-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Discover Your Vibe</span>
            {userLocation && (
              <Badge variant="secondary" className="ml-auto">
                <MapPin className="w-3 h-3 mr-1" />
                Location detected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  placeholder="Enter city or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowPredictions(true)}
                  className="bg-background/50"
                />

                {/* Location Predictions Dropdown */}
                {showPredictions && locationPredictions.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      {locationPredictions.map((location) => (
                        <div
                          key={location.place_id}
                          className="p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <div className="font-medium">{location.main_text}</div>
                          <div className="text-sm text-muted-foreground">{location.secondary_text}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button
                variant="outline"
                onClick={detectCurrentLocation}
                disabled={gettingLocation}
                className="px-3 bg-transparent"
              >
                {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              </Button>

              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {placeCategories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedCategory === category.id ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-1">{category.emoji}</div>
                  <p className="text-xs font-medium">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {selectedCategory && (
        <Card className="vibe-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>{placeCategories.find((c) => c.id === selectedCategory)?.emoji}</span>
                <span>
                  {placeCategories.find((c) => c.id === selectedCategory)?.name} in {currentCity || "your area"}
                </span>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "info" | "vibe")}>
                  <TabsList>
                    <TabsTrigger value="info">Info View</TabsTrigger>
                    <TabsTrigger value="vibe">Vibe View</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Select
                  value={sortOrder}
                  onValueChange={(value: "vibeScore" | "rating" | "distance") => setSortOrder(value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vibeScore">Vibe Score</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDirection} onValueChange={(value: "desc" | "asc") => setSortDirection(value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground">Discovering amazing places for you...</p>
                </div>
              </div>
            ) : sortedPlaces.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? "No places found. Try a different location or category."
                    : "Select a category to start exploring!"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {sortedPlaces.map((place) => (
                  <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col lg:flex-row">
                      {/* Image */}
                      <div className="w-full lg:w-80 h-48 lg:h-auto bg-muted flex items-center justify-center relative">
                        {place.image && !place.image.includes("placeholder") ? (
                          <img
                            src={place.image || "/placeholder.svg"}
                            alt={place.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=300&width=400"
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}

                        {/* Favorite Button */}
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                          onClick={() => handleFavoriteToggle(place)}
                        >
                          <Heart className={`w-4 h-4 ${place.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <Tabs value={viewMode} className="w-full">
                          <TabsContent value="info" className="mt-0">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold">{place.name}</h3>
                                  <p className="text-muted-foreground">{place.address}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-medium">{place.rating}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{place.distance}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{place.travelTime}</span>
                                    </div>
                                    {place.openingHours && place.openingHours !== "Hours not available" && (
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{place.openingHours}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* AI-generated tagline */}
                              <p className="text-sm italic text-primary/80">"{place.description}"</p>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2 pt-4">
                                <Button asChild>
                                  <a href={getDirectionsUrl(place)} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Get Directions
                                  </a>
                                </Button>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline">
                                      <Info className="w-4 h-4 mr-2" />
                                      Get Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>{place.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      {place.image && !place.image.includes("placeholder") && (
                                        <img
                                          src={place.image || "/placeholder.svg"}
                                          alt={place.name}
                                          className="w-full h-48 object-cover rounded-md"
                                        />
                                      )}

                                      <div>
                                        <h4 className="font-semibold mb-2">Address</h4>
                                        <p className="text-sm">{place.address}</p>
                                      </div>

                                      {place.website && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Website</h4>
                                          <a
                                            href={place.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm flex items-center gap-1"
                                          >
                                            {place.website} <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      )}

                                      {place.phone && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Contact Info</h4>
                                          <p className="text-sm">{place.phone}</p>
                                        </div>
                                      )}

                                      {place.description && (
                                        <div>
                                          <h4 className="font-semibold mb-2">About This Place</h4>
                                          <p className="text-sm">{place.description}</p>
                                        </div>
                                      )}

                                      {place.workingDays && place.workingDays.length > 0 && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Detailed Working Hours</h4>
                                          <ul className="text-sm space-y-1">
                                            {place.workingDays.map((day, index) => (
                                              <li key={index}>{day}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {place.reviews && place.reviews.length > 0 && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Recent Reviews</h4>
                                          <div className="space-y-3">
                                            {place.reviews.map((review) => (
                                              <div key={review.id} className="border-l-2 border-primary/20 pl-3">
                                                <div className="flex items-center space-x-2 mb-1">
                                                  {review.profilePhoto && (
                                                    <img
                                                      src={review.profilePhoto || "/placeholder.svg"}
                                                      alt={review.author}
                                                      className="w-6 h-6 rounded-full"
                                                    />
                                                  )}
                                                  <span className="font-medium text-sm">{review.author}</span>
                                                  <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${
                                                          i < review.rating
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-gray-300"
                                                        }`}
                                                      />
                                                    ))}
                                                  </div>
                                                  <span className="text-xs text-muted-foreground">{review.time}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{review.text}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {place.coordinates &&
                                        typeof place.coordinates.lat === "number" &&
                                        typeof place.coordinates.lng === "number" && (
                                          <div>
                                            <h4 className="font-semibold mb-2">Location Map</h4>
                                            <GoogleMaps
                                              center={place.coordinates}
                                              zoom={15}
                                              places={[place]}
                                              className="h-64"
                                            />
                                          </div>
                                        )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="vibe" className="mt-0">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <h3 className="text-xl font-bold">{place.name}</h3>
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-primary">{place.vibeScore}%</div>
                                  <div className="text-sm text-muted-foreground">Vibe Match</div>
                                </div>
                              </div>

                              <div className="flex space-x-2 text-3xl">
                                {place.personalizedEmojis?.map((emoji, index) => (
                                  <span key={index}>{emoji}</span>
                                ))}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {place.tags.map((tag) => (
                                  <Badge key={tag} className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              <p className="text-sm italic text-muted-foreground">"{place.vibeDescription}"</p>

                              {place.reviews && place.reviews.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">What people say:</p>
                                  {place.reviews.slice(0, 2).map((review, index) => (
                                    <p key={index} className="text-xs text-muted-foreground italic">
                                      "• {review.text}"
                                    </p>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-4">
                                <Dialog onOpenChange={(open) => !open && setSelectedPlace(null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setSelectedPlace(place)}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Share Experience
                                    </Button>
                                  </DialogTrigger>
                                  {selectedPlace && (
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Share Your Experience at {selectedPlace.name}</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="review-rating">Your Rating</Label>
                                          <Select
                                            value={String(reviewRating)}
                                            onValueChange={(val) => setReviewRating(Number(val))}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select a rating" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {[1, 2, 3, 4, 5].map((num) => (
                                                <SelectItem key={num} value={String(num)}>
                                                  {num} Star{num > 1 && "s"}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label htmlFor="review-text">Your Review</Label>
                                          <Textarea
                                            id="review-text"
                                            placeholder="Tell us about your experience..."
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            rows={4}
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button onClick={() => handleAddReview(selectedPlace)}>Submit Review</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  )}
                                </Dialog>

                                <Button variant="outline" onClick={() => handleSharePlace(place)}>
                                  {navigator.share ? (
                                    <>
                                      <Share2 className="w-4 h-4 mr-2" />
                                      Share Place
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Link
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
