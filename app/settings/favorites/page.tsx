"use client"

import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, MapPin, Star, Clock, Navigation, ExternalLink, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FavoritesPage() {
  const router = useRouter()
  const { favorites, removeFromFavorites, userLocation } = useProfileStore()
  const { toast } = useToast()

  const handleRemoveFavorite = (placeId: string, placeName: string) => {
    if (confirm(`Are you sure you want to remove ${placeName} from your favorites?`)) {
      removeFromFavorites(placeId)
      toast({ title: `${placeName} removed from favorites` })
    }
  }

  const getDirectionsUrl = (place: any) => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${place.coordinates.lat},${place.coordinates.lng}`
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold">My Favorites ❤️</h1>
        </div>

        <Card className="vibe-card max-w-4xl mx-auto">
          <CardContent className="space-y-6 pt-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You haven't added any favorite places yet.</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard?tab=search">Start Discovering</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {favorites.map((fav) => (
                  <Card key={fav.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                      {fav.place.image && !fav.place.image.includes("placeholder") && (
                        <img
                          src={fav.place.image || "/placeholder.svg"}
                          alt={fav.place.name}
                          className="w-full md:w-32 h-24 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{fav.place.name}</h3>
                        <p className="text-sm text-muted-foreground">{fav.place.address}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{fav.place.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{fav.place.distance}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{fav.place.travelTime}</span>
                          </div>
                        </div>
                        {fav.notes && <p className="text-sm italic text-primary/80">"Notes: {fav.notes}"</p>}
                      </div>
                      <div className="flex flex-col gap-2 md:ml-auto">
                        <Button size="sm" asChild>
                          <a href={getDirectionsUrl(fav.place)} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4 mr-1" />
                            Directions
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFavorite(fav.place.id, fav.place.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
