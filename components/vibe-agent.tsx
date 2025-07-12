"use client"

import { CardTitle } from "@/components/ui/card"

import { useState, useEffect, useRef } from "react"
import { useProfileStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CardContent } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, User, Loader2, Send } from "lucide-react"

type Message = {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
}

export default function VibeAgent() {
  const { profile, currentCity } = useProfileStore()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (profile && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "agent",
        content: `Welcome back explorer! 🌍 I'm your Vibe Navigator AI assistant. 

Based on your ${profile.personalityType.toLowerCase()} personality and love for ${profile.preferredPlaces.slice(0, 2).join(" and ")}, I'm here to help you discover amazing places in ${currentCity || "your city"} that match your energy! ✨

What kind of experience are you looking for today? I can help you find places, plan itineraries, or just chat about travel vibes! 🧭`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [profile, currentCity, messages.length])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

  const quickPrompts = [
    "Find me a cozy cafe with aesthetic vibes ☕",
    "Plan a chill evening that's budget-friendly 🌅",
    "Suggest hidden gems for photography 📸",
    "Where can I find peaceful spots for reading? 📚",
    "Recommend places for a romantic date 💕",
    "Show me the best local food spots 🍽️",
  ]

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !profile) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      // Call AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          userProfile: profile,
          cityContext: currentCity || "Delhi",
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error from server" }))
        throw new Error(errorData.error || "Failed to get AI response")
      }

      const data = await response.json()

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: data.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessageContent = error instanceof Error ? error.message : "An unexpected error occurred."

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: `AI request failed: ${errorMessageContent}. Please try again.`, // Display specific error
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "AI request failed",
        description: errorMessageContent, // Display specific error in toast
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
    }
  }

  const formatMessageContent = (content: string) => {
    // Simple formatting for better readability
    return content.split("\n").map((line, index) => {
      // Bold text for **text**
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text for *text*
      line = line.replace(/\*(.*?)*\//g, "<em>$1</em>")

      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < content.split("\n").length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className="space-y-6">
      <Card className="vibe-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>Vibe AI Agent</span>
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Gemini Flash Latest
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chat Messages */}
          <ScrollArea className="h-96 mb-4 p-4 border rounded-lg bg-background/50" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border/50"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "agent" && <Bot className="w-4 h-4 mt-1 text-primary flex-shrink-0" />}
                      {message.type === "user" && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm leading-relaxed">{formatMessageContent(message.content)}</div>
                        <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg border border-border/50">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs h-8"
                  disabled={isTyping}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Ask me anything about places, vibes, or itineraries..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage(inputMessage)}
              className="bg-background/50"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              size="icon"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Helpful Tips */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro tip:</strong> I work best when you tell me your mood, budget, or specific preferences! Try
              asking things like "Find me a quiet cafe under ₹500" or "Plan a fun evening with friends in Bangalore"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
