"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, User, Users, MapPin } from "lucide-react"

export default function ProfileSetup() {
  const router = useRouter()
  const { setProfile } = useProfileStore()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    personalityType: "",
    travelCompanion: "",
    preferredPlaces: [] as string[],
  })

  const personalityTypes = [
    { id: "Adventurous", emoji: "🏔️", description: "Love exploring and trying new things" },
    { id: "Chill", emoji: "😌", description: "Prefer relaxed and peaceful experiences" },
    { id: "Curious", emoji: "🤔", description: "Always eager to learn and discover" },
    { id: "Spiritual", emoji: "🧘", description: "Seek meaningful and mindful experiences" },
    { id: "Creative", emoji: "🎨", description: "Drawn to artistic and inspiring places" },
    { id: "Social", emoji: "🎉", description: "Enjoy vibrant and social atmospheres" },
  ]

  const travelCompanions = [
    { id: "Solo", emoji: "🚶", description: "I love exploring on my own" },
    { id: "Friends", emoji: "👥", description: "Usually travel with friends" },
    { id: "Partner", emoji: "💑", description: "Travel with my significant other" },
    { id: "Family", emoji: "👨‍👩‍👧‍👦", description: "Family trips are my favorite" },
  ]

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

  const handlePlaceToggle = (place: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredPlaces: prev.preferredPlaces.includes(place)
        ? prev.preferredPlaces.filter((p) => p !== place)
        : [...prev.preferredPlaces, place],
    }))
  }

  const handleSubmit = () => {
    const profile: UserProfile = {
      id: Date.now().toString(),
      name: formData.name,
      age: Number.parseInt(formData.age),
      personalityType: formData.personalityType as any,
      travelCompanion: formData.travelCompanion as any,
      preferredPlaces: formData.preferredPlaces,
      createdAt: new Date(),
    }

    setProfile(profile)
    router.push("/dashboard")
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.age
      case 2:
        return formData.personalityType
      case 3:
        return formData.travelCompanion
      case 4:
        return formData.preferredPlaces.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Vibe Profile</CardTitle>
          <p className="text-muted-foreground">Step {step} of 4 - Help us understand your travel personality</p>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Tell us about yourself</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">What's your name?</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="age">How old are you?</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">What's your personality type?</h3>
                <p className="text-muted-foreground">Choose the one that resonates most with you</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalityTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.personalityType === type.id ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, personalityType: type.id }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{type.emoji}</div>
                      <h4 className="font-semibold">{type.id}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Who do you usually travel with?</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {travelCompanions.map((companion) => (
                  <Card
                    key={companion.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.travelCompanion === companion.id
                        ? "ring-2 ring-primary bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, travelCompanion: companion.id }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{companion.emoji}</div>
                      <h4 className="font-semibold">{companion.id}</h4>
                      <p className="text-sm text-muted-foreground">{companion.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">What kind of places do you love?</h3>
                <p className="text-muted-foreground">Select all that apply (minimum 1)</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {placeTypes.map((place) => (
                  <Badge
                    key={place}
                    variant={formData.preferredPlaces.includes(place) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-2 text-sm transition-all duration-300"
                    onClick={() => handlePlaceToggle(place)}
                  >
                    {place}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : router.push("/"))}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step > 1 ? "Previous" : "Back to Home"}
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()}>
                Complete Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
