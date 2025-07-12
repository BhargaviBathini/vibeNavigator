"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash2, Heart, MessageSquare } from "lucide-react" // Changed from MessageSquareText
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile, setProfile, clearProfile } = useProfileStore()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    personalityType: "",
    travelCompanion: "",
    preferredPlaces: [] as string[],
  })

  // Initialize form data when profile changes or component mounts
  const initializeFormData = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age.toString(),
        personalityType: profile.personalityType,
        travelCompanion: profile.travelCompanion,
        preferredPlaces: profile.preferredPlaces,
      })
    }
  }

  useState(() => {
    initializeFormData()
  }, [profile])

  // Redirect if profile is missing
  if (!profile) {
    router.push("/")
    return null
  }

  /* ------------------------------------------------------------------ */
  /* ---------------------------  CONSTANTS  --------------------------- */
  /* ------------------------------------------------------------------ */

  const personalityTypes = [
    { id: "Adventurous", emoji: "🏔️" },
    { id: "Chill", emoji: "😌" },
    { id: "Curious", emoji: "🤔" },
    { id: "Spiritual", emoji: "🧘" },
    { id: "Creative", emoji: "🎨" },
    { id: "Social", emoji: "🎉" },
  ] as const

  const travelCompanions = [
    { id: "Solo", emoji: "🚶" },
    { id: "Friends", emoji: "👥" },
    { id: "Partner", emoji: "💑" },
    { id: "Family", emoji: "👨‍👩‍👧‍👦" },
  ] as const

  const placeTypes = [
    "Cafes & Coffee Shops",
    "Parks & Gardens",
    "Museums & Art Galleries",
    "Historical Sites",
    "Beaches & Waterfronts",
    "Mountains & Nature",
    "Bookstores & Libraries",
    "Markets & Shopping",
    "Nightlife & Bars",
    "Religious & Spiritual Sites",
    "Adventure Activities",
    "Scenic Viewpoints",
  ]

  /* ------------------------------------------------------------------ */
  /* --------------------------  HANDLERS  ----------------------------- */
  /* ------------------------------------------------------------------ */

  const handleSave = () => {
    if (!formData.name.trim() || !formData.age.trim()) {
      toast({ title: "Name and age are required", variant: "destructive" })
      return
    }

    const updated: UserProfile = {
      ...profile,
      name: formData.name.trim(),
      age: Number.parseInt(formData.age),
      personalityType: formData.personalityType as UserProfile["personalityType"],
      travelCompanion: formData.travelCompanion as UserProfile["travelCompanion"],
      preferredPlaces: formData.preferredPlaces,
    }

    setProfile(updated)
    setIsEditing(false)
    toast({ title: "Profile updated!" })
  }

  const handlePlaceToggle = (place: string) =>
    setFormData((prev) => ({
      ...prev,
      preferredPlaces: prev.preferredPlaces.includes(place)
        ? prev.preferredPlaces.filter((p) => p !== place)
        : [...prev.preferredPlaces, place],
    }))

  const handleDeleteProfile = () => {
    if (confirm("Are you sure you want to delete your profile and start over? This action cannot be undone.")) {
      clearProfile()
      router.push("/")
    }
  }

  /* ------------------------------------------------------------------ */
  /* ---------------------------  RENDER  ------------------------------ */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        <Card className="vibe-card max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit your vibe profile</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              ) : (
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ----- BASIC INFO ----- */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  disabled={!isEditing}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                />
              </div>
            </div>

            {/* ----- PERSONALITY ----- */}
            <div>
              <Label className="mb-2 block">Personality Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {personalityTypes.map((p) => (
                  <Card
                    key={p.id}
                    onClick={() => isEditing && setFormData((d) => ({ ...d, personalityType: p.id }))}
                    className={`cursor-pointer ${
                      formData.personalityType === p.id ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"
                    } transition`}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">{p.emoji}</div>
                      <p className="text-sm font-medium">{p.id}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ----- COMPANION ----- */}
            <div>
              <Label className="mb-2 block">Travel Style *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {travelCompanions.map((t) => (
                  <Card
                    key={t.id}
                    onClick={() => isEditing && setFormData((d) => ({ ...d, travelCompanion: t.id }))}
                    className={`cursor-pointer ${
                      formData.travelCompanion === t.id ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"
                    } transition`}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl mb-1">{t.emoji}</div>
                      <p className="text-sm font-medium">{t.id}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* ----- PREFERRED PLACES ----- */}
            <div>
              <Label className="mb-2 block">Preferred Places</Label>
              <div className="flex flex-wrap gap-2">
                {placeTypes.map((place) => (
                  <Badge
                    key={place}
                    onClick={() => isEditing && handlePlaceToggle(place)}
                    variant={formData.preferredPlaces.includes(place) ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {place}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ----- NAVIGATION TO FAVORITES & REVIEWS ----- */}
            <div className="pt-4 border-t border-border space-y-3">
              <h3 className="text-lg font-semibold">Your Activity</h3>
              <Button variant="outline" className="justify-start w-full bg-transparent" asChild>
                <Link href="/settings/favorites">
                  <Heart className="w-4 h-4 mr-2" />
                  My Favorites
                </Link>
              </Button>
              <Button variant="outline" className="justify-start w-full bg-transparent" asChild>
                <Link href="/settings/reviews">
                  <MessageSquare className="w-4 h-4 mr-2" /> {/* Changed from MessageSquareText */}
                  My Reviews
                </Link>
              </Button>
            </div>

            {/* ----- DELETE ----- */}
            {isEditing && (
              <div className="pt-4 border-t border-border">
                <Button variant="destructive" onClick={handleDeleteProfile}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
