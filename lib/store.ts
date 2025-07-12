import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserProfile, VibePlace, UserReview, FavoritePlace } from "./types"

interface ProfileStore {
  profile: UserProfile | null
  isProfileComplete: boolean
  currentCity: string
  selectedCategory: string
  searchResults: VibePlace[]
  favorites: FavoritePlace[]
  userReviews: UserReview[]
  userLocation: { lat: number; lng: number; address: string; city: string } | null // Added city to userLocation

  // Profile actions
  setProfile: (profile: UserProfile) => void
  setCurrentCity: (city: string) => void
  setSelectedCategory: (category: string) => void
  setSearchResults: (results: VibePlace[]) => void
  setUserLocation: (location: { lat: number; lng: number; address: string; city: string }) => void // Updated type
  clearProfile: () => void

  // Favorites actions
  addToFavorites: (place: VibePlace, notes?: string) => void
  removeFromFavorites: (placeId: string) => void
  isFavorite: (placeId: string) => boolean

  // Reviews actions
  addReview: (review: Omit<UserReview, "id" | "createdAt">) => void
  updateReview: (reviewId: string, updates: Partial<UserReview>) => void
  deleteReview: (reviewId: string) => void
  getReviewsForPlace: (placeId: string) => UserReview[]
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isProfileComplete: false,
      currentCity: "",
      selectedCategory: "",
      searchResults: [],
      favorites: [],
      userReviews: [],
      userLocation: null,

      setProfile: (profile) => set({ profile, isProfileComplete: true }),
      setCurrentCity: (city) => set({ currentCity: city }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSearchResults: (results) => set({ searchResults: results }),
      setUserLocation: (location) => set({ userLocation: location }),
      clearProfile: () =>
        set({
          profile: null,
          isProfileComplete: false,
          favorites: [],
          userReviews: [],
          userLocation: null,
        }),

      addToFavorites: (place, notes) => {
        const favorite: FavoritePlace = {
          id: Date.now().toString(),
          place: { ...place, isFavorite: true },
          addedAt: new Date(),
          notes,
        }
        set((state) => ({ favorites: [...state.favorites, favorite] }))
      },

      removeFromFavorites: (placeId) => {
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.place.id !== placeId),
        }))
      },

      isFavorite: (placeId) => {
        return get().favorites.some((fav) => fav.place.id === placeId)
      },

      addReview: (reviewData) => {
        const review: UserReview = {
          ...reviewData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        set((state) => ({ userReviews: [...state.userReviews, review] }))
      },

      updateReview: (reviewId, updates) => {
        set((state) => ({
          userReviews: state.userReviews.map((review) => (review.id === reviewId ? { ...review, ...updates } : review)),
        }))
      },

      deleteReview: (reviewId) => {
        set((state) => ({
          userReviews: state.userReviews.filter((review) => review.id !== reviewId),
        }))
      },

      getReviewsForPlace: (placeId) => {
        return get().userReviews.filter((review) => review.placeId === placeId)
      },
    }),
    {
      name: "vibe-navigator-store",
    },
  ),
)
