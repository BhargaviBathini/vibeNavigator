"use client"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, MessageCircle, Settings, LogOut, Compass, Heart, MessageSquare } from "lucide-react" // Changed from MessageSquareText
import VibeSearch from "@/components/vibe-search"
import VibeAgent from "@/components/vibe-agent"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const { profile, isProfileComplete, clearProfile } = useProfileStore()
  const [activeTab, setActiveTab] = useState("search")
  const [isClient, setIsClient] = useState(false) // New state for hydration check

  useEffect(() => {
    setIsClient(true) // Mark as client-side after first render
  }, [])

  useEffect(() => {
    if (isClient) {
      // Only run redirect logic on client
      if (!isProfileComplete || !profile) {
        console.log("Profile not complete or missing, redirecting to /")
        router.push("/")
      } else {
        console.log("Profile complete, rendering dashboard for:", profile.name)
      }
    }
  }, [isProfileComplete, profile, router, isClient])

  if (!isClient || !profile) {
    // Show nothing or a loader until hydrated and profile is available
    return null // Or a loading spinner
  }

  const getPersonalityEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      Adventurous: "🏔️",
      Chill: "😌",
      Curious: "🤔",
      Spiritual: "🧘",
      Creative: "🎨",
      Social: "🎉",
    }
    return emojiMap[type] || "🧭"
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Compass className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold">Vibe Navigator</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getPersonalityEmoji(profile.personalityType)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{profile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.personalityType} • {profile.travelCompanion}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" size="icon" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>

              <Button variant="outline" size="icon" onClick={clearProfile}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile.name}! 🌍</h2>
          <p className="text-muted-foreground">
            Ready to discover places that match your {profile.personalityType.toLowerCase()} vibe?
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Vibe Search</span>
            </TabsTrigger>
            <TabsTrigger value="agent" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Vibe AI Agent</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <VibeSearch />
          </TabsContent>

          <TabsContent value="agent" className="space-y-6">
            <VibeAgent />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="vibe-card">
              <CardHeader>
                <CardTitle>Settings & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button variant="outline" className="justify-start bg-transparent" asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit User Profile
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start bg-transparent" asChild>
                  <Link href="/settings/favorites">
                    <Heart className="w-4 h-4 mr-2" />
                    My Favorites
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start bg-transparent" asChild>
                  <Link href="/settings/reviews">
                    <MessageSquare className="w-4 h-4 mr-2" /> {/* Changed from MessageSquareText */}
                    My Reviews
                  </Link>
                </Button>
                <Button variant="destructive" className="justify-start" onClick={clearProfile}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Clear Profile & Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
