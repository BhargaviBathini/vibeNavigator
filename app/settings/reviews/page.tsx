"use client"

import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Star, Trash2, Edit } from "lucide-react" // Changed from MessageSquareText
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { UserReview } from "@/lib/types"

export default function ReviewsPage() {
  const router = useRouter()
  const { userReviews, updateReview, deleteReview } = useProfileStore()
  const { toast } = useToast()

  const [isEditingReview, setIsEditingReview] = useState(false)
  const [currentReview, setCurrentReview] = useState<UserReview | null>(null)
  const [editReviewText, setEditReviewText] = useState("")
  const [editReviewRating, setEditReviewRating] = useState(5)

  const handleEditClick = (review: UserReview) => {
    setCurrentReview(review)
    setEditReviewText(review.text)
    setEditReviewRating(review.rating)
    setIsEditingReview(true)
  }

  const handleUpdateReview = () => {
    if (!currentReview) return
    if (!editReviewText.trim()) {
      toast({ title: "Review cannot be empty", variant: "destructive" })
      return
    }

    updateReview(currentReview.id, {
      text: editReviewText.trim(),
      rating: editReviewRating,
    })
    setIsEditingReview(false)
    setCurrentReview(null)
    toast({ title: "Review updated successfully!" })
  }

  const handleDeleteReview = (reviewId: string, placeName: string) => {
    if (confirm(`Are you sure you want to delete your review for ${placeName}?`)) {
      deleteReview(reviewId)
      toast({ title: `Review for ${placeName} deleted` })
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold">My Reviews 📝</h1>
        </div>

        <Card className="vibe-card max-w-4xl mx-auto">
          <CardContent className="space-y-6 pt-6">
            {userReviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />{" "}
                {/* Changed from MessageSquareText */}
                <p className="text-muted-foreground">You haven't written any reviews yet.</p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard?tab=search">Start Exploring & Reviewing</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {userReviews.map((review) => (
                  <Card key={review.id} className="overflow-hidden">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{review.placeName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span>{review.rating} Stars</span>
                          <span className="text-xs text-muted-foreground">{review.createdAt.toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{review.text}"</p>
                      </div>
                      <div className="flex flex-col gap-2 md:ml-auto">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(review)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReview(review.id, review.placeName)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Review Dialog */}
        {currentReview && (
          <Dialog open={isEditingReview} onOpenChange={setIsEditingReview}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Your Review for {currentReview.placeName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-review-rating">Your Rating</Label>
                  <Select value={String(editReviewRating)} onValueChange={(val) => setEditReviewRating(Number(val))}>
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
                  <Label htmlFor="edit-review-text">Your Review</Label>
                  <Textarea
                    id="edit-review-text"
                    placeholder="Edit your experience..."
                    value={editReviewText}
                    onChange={(e) => setEditReviewText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateReview}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
