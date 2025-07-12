"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Compass, Sparkles, MapPin, Heart } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const { isProfileComplete } = useProfileStore()

  useEffect(() => {
    if (isProfileComplete) {
      router.push("/dashboard")
    }
  }, [isProfileComplete, router])

  const features = [
    {
      icon: <Compass className="w-8 h-8" />,
      title: "Vibe-Based Discovery",
      description: "Find places that match your energy, not just categories",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI-Powered Recommendations",
      description: "Get personalized suggestions from our intelligent agent",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Real-Time Information",
      description: "Live data on timings, ratings, and travel directions",
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Curated Experiences",
      description: "Discover hidden gems and aesthetic spots",
    },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              🧭 Discover Your Vibe
            </Badge>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Vibe Navigator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop searching for places. Start discovering experiences that match your energy. Our AI finds locations
              based on vibes, not just categories.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg" onClick={() => router.push("/profile-setup")}>
              Start Your Journey
              <Compass className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg bg-transparent">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {features.map((feature, index) => (
            <Card key={index} className="vibe-card text-center">
              <CardContent className="pt-6">
                <div className="category-icon mx-auto mb-4 text-primary">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Create Your Vibe Profile</h3>
              <p className="text-muted-foreground">Tell us about your personality and travel preferences</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Search by Vibe</h3>
              <p className="text-muted-foreground">Find places that match your energy and mood</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Get AI Recommendations</h3>
              <p className="text-muted-foreground">Chat with our AI agent for personalized itineraries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
