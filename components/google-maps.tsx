"use client"

import { useEffect, useRef } from "react"

interface GoogleMapsProps {
  center: { lat: number; lng: number }
  zoom?: number
  places?: Array<{
    id: string
    name: string
    coordinates: { lat: number; lng: number }
    rating: number
  }>
  className?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function GoogleMaps({ center, zoom = 13, places = [], className = "" }: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Load Google Maps script
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#1f2937" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#374151" }],
          },
        ],
      })

      mapInstanceRef.current = map

      // Add markers for places
      places.forEach((place) => {
        const marker = new window.google.maps.Marker({
          position: place.coordinates,
          map,
          title: place.name,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2"/>
                <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">${Math.round(place.rating)}</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #000; padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${place.name}</h3>
              <p style="margin: 0; font-size: 12px;">Rating: ${place.rating}/5 ⭐</p>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })
      })
    }

    loadGoogleMaps()
  }, [center, zoom, places])

  return (
    <div
      ref={mapRef}
      className={`w-full h-64 rounded-lg border border-border ${className}`}
      style={{ minHeight: "256px" }}
    />
  )
}
