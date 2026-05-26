"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { api, ApiError } from "@/lib/api-client"
import { useProviderCredits } from "@/hooks/use-provider-credits"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditsNonRefundableNotice } from "@/components/credits/credits-non-refundable-notice"
import { MapPin, X, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import type {
  PlaceResult,
  PromotionLocation,
  CoverageType,
  AdCreditLocationPricing,
} from "@/types"
import { ROUTES } from "@/lib/constants"

// ─── Types ──────────────────────────────────────────────

interface LocationPickerProps {
  promotionId: string
  promotionType: "service" | "promotion" | string
}

interface MapObjects {
  marker: google.maps.Marker
  circle: google.maps.Circle
}

// ─── Constants ──────────────────────────────────────────

const DEFAULT_CENTER = { lat: -2.1894, lng: -79.8891 }
const DEFAULT_ZOOM = 12
const DEBOUNCE_MS = 300
const MAX_LOCATIONS = 5

const POINT_COLOR = "#FF6B35"
const POINT_RADIUS = 1000
const CITY_COLOR = "#4A90D9"
const CITY_RADIUS = 10000

// Module-level flag: setOptions must only be called once
let googleMapsInitialized = false

// ─── Component ──────────────────────────────────────────

export function LocationPicker({ promotionId, promotionType }: LocationPickerProps) {
  const { toast } = useToast()
  const { balance: creditBalance, setBalance } = useProviderCredits()

  // State
  const [locations, setLocations] = useState<PromotionLocation[]>([])
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [locationPendingRemoval, setLocationPendingRemoval] =
    useState<PromotionLocation | null>(null)

  // Selection confirmation state
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [coverageType, setCoverageType] = useState<CoverageType>("point")
  const [pricing, setPricing] = useState<AdCreditLocationPricing | null>(null)

  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const mapObjectsRef = useRef<Map<string, MapObjects>>(new Map())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const heading =
    promotionType === "service"
      ? "¿Dónde está ubicado tu local o lugar de servicio?"
      : "¿En qué zonas quieres mostrar esta promoción?"

  const locationCost =
    pricing != null
      ? Number(
          coverageType === "city"
            ? pricing.city_credits
            : pricing.point_credits,
        )
      : null

  const canAfford =
    locationCost == null ||
    creditBalance == null ||
    creditBalance >= locationCost

  // ─── Precios por ubicación (saldo vía ProviderCredits) ──

  useEffect(() => {
    let cancelled = false
    async function loadPricing() {
      try {
        const priceRes = await api.credits.locationPricing()
        if (!cancelled) setPricing(priceRes)
      } catch {
        if (!cancelled) setPricing(null)
      }
    }
    loadPricing()
    return () => {
      cancelled = true
    }
  }, [])

  // ─── Map initialization ─────────────────────────────

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn("LocationPicker: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set")
      return
    }

    if (!googleMapsInitialized) {
      setOptions({ key: apiKey, v: "weekly" })
      googleMapsInitialized = true
    }

    await importLibrary("maps")
    await importLibrary("marker")

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
  }, [])

  // ─── Pin helpers ────────────────────────────────────

  const addPin = useCallback((location: PromotionLocation) => {
    const map = mapInstanceRef.current
    if (!map) return

    const isCity = location.coverage_type === "city"
    const position = { lat: location.place.lat, lng: location.place.lng }

    const marker = new google.maps.Marker({
      map,
      position,
      title: location.place.address || undefined,
    })

    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: isCity ? CITY_RADIUS : POINT_RADIUS,
      fillColor: isCity ? CITY_COLOR : POINT_COLOR,
      fillOpacity: isCity ? 0.15 : 0.2,
      strokeColor: isCity ? CITY_COLOR : POINT_COLOR,
      strokeOpacity: 0.4,
      strokeWeight: 2,
    })

    mapObjectsRef.current.set(location.id, { marker, circle })
  }, [])

  const removePin = useCallback((locationId: string) => {
    const objects = mapObjectsRef.current.get(locationId)
    if (objects) {
      objects.marker.setMap(null)
      objects.circle.setMap(null)
      mapObjectsRef.current.delete(locationId)
    }
  }, [])

  const fitBounds = useCallback((locs: PromotionLocation[]) => {
    const map = mapInstanceRef.current
    if (!map || locs.length === 0) return

    if (locs.length === 1) {
      map.setCenter({ lat: locs[0].place.lat, lng: locs[0].place.lng })
      map.setZoom(DEFAULT_ZOOM)
      return
    }

    const bounds = new google.maps.LatLngBounds()
    locs.forEach((loc) => bounds.extend({ lat: loc.place.lat, lng: loc.place.lng }))
    map.fitBounds(bounds, 60)
  }, [])

  // ─── Load existing locations ────────────────────────

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        await initMap()
        const raw = await api.locations.list(promotionId)
        if (cancelled) return
        // Ensure coverage_type defaults to "point" if backend omits it
        const data = raw.map((loc) => ({
          ...loc,
          coverage_type: loc.coverage_type || ("point" as const),
        }))
        setLocations(data)
        data.forEach(addPin)
        fitBounds(data)
      } catch {
        // silently fail — map will still render
      } finally {
        if (!cancelled) setLoadingLocations(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [promotionId, initMap, addPin, fitBounds])

  // ─── Search ─────────────────────────────────────────

  function handleSearchChange(value: string) {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await api.places.search(value.trim())
        setSearchResults(res.data)
        setShowDropdown(res.data.length > 0)
      } catch {
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }, DEBOUNCE_MS)
  }

  // ─── Select from dropdown → show confirmation ─────

  function handleDropdownSelect(place: PlaceResult) {
    setShowDropdown(false)
    setQuery("")
    setSearchResults([])
    setSelectedPlace(place)

    // Heuristic: if address looks like just a city name (no street number), preselect "city"
    const addr = place.address || ""
    const looksLikeCity = !addr.match(/\d/) || addr.toLowerCase() === (place.city || "").toLowerCase()
    setCoverageType(looksLikeCity ? "city" : "point")
  }

  // ─── Confirm add location ────────────────────────

  async function handleConfirmAdd() {
    if (!selectedPlace) return
    setIsAdding(true)

    try {
      const rawLocation = await api.locations.add(promotionId, selectedPlace.id, coverageType)
      // Always use the user's selection — backend response may default to "point"
      const newLocation: PromotionLocation = {
        ...rawLocation,
        coverage_type: coverageType,
      }
      setLocations((prev) => [...prev, newLocation])
      addPin(newLocation)
      setSelectedPlace(null)
      if (newLocation.balance_after != null) {
        setBalance(Number(newLocation.balance_after))
      }

      const map = mapInstanceRef.current
      if (map) {
        map.setCenter({ lat: newLocation.place.lat, lng: newLocation.place.lng })
        map.setZoom(DEFAULT_ZOOM)
      }

      const charged = newLocation.credits_charged
      toast({
        title: "Ubicación agregada",
        description:
          charged != null
            ? `Se descontaron ${Number(charged)} créditos.`
            : "La ubicación quedó vinculada a tu publicación.",
      })
    } catch (err) {
      let message = "No se pudo agregar la ubicación"
      if (err instanceof ApiError) {
        if (err.status === 409) {
          message = "Esta ubicación ya está vinculada"
        } else if (err.status === 402 || err.message.toLowerCase().includes("saldo")) {
          message = err.message
        } else if (err.status === 400) {
          message =
            err.message.includes("5") || err.message.toLowerCase().includes("máximo")
              ? "Máximo 5 ubicaciones permitidas"
              : err.message
        } else {
          message = err.message
        }
      }
      toast({ variant: "destructive", title: "Error", description: message })
    } finally {
      setIsAdding(false)
    }
  }

  // ─── Remove location ───────────────────────────────

  function requestRemoveLocation(loc: PromotionLocation) {
    setLocationPendingRemoval(loc)
  }

  async function confirmRemoveLocation() {
    if (!locationPendingRemoval) return
    const locationId = locationPendingRemoval.id
    setDeletingId(locationId)
    try {
      await api.locations.remove(promotionId, locationId)
      removePin(locationId)
      setLocations((prev) => {
        const updated = prev.filter((l) => l.id !== locationId)
        fitBounds(updated)
        return updated
      })
      setLocationPendingRemoval(null)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo eliminar la ubicación",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Close dropdown on outside click ───────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ─── Render ─────────────────────────────────────────

  const atLimit = locations.length >= MAX_LOCATIONS

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">{heading}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locations.length}/{MAX_LOCATIONS} ubicaciones
        </p>
      </div>

      {pricing != null && (
        <p className="text-sm text-muted-foreground rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          Créditos por ubicación:{" "}
          <strong>{Number(pricing.point_credits)}</strong> (punto) ·{" "}
          <strong>{Number(pricing.city_credits)}</strong> (ciudad).{" "}
          {creditBalance != null && (
            <>
              Saldo: <strong>{creditBalance}</strong>.{" "}
              <Link href={ROUTES.CREDITS} className="text-[#4a6b1e] underline font-medium">
                Comprar créditos
              </Link>
            </>
          )}
        </p>
      )}

      <CreditsNonRefundableNotice variant="location-spend" />

      {/* Search input */}
      {!selectedPlace && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={atLimit ? "Máximo de ubicaciones alcanzado" : "Buscar dirección o lugar..."}
              disabled={atLimit || isAdding}
              className="h-9 pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-[240px] overflow-y-auto">
              {searchResults.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleDropdownSelect(place)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0"
                >
                  <p className="text-sm truncate">{place.address || "Sin dirección"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[place.city, place.country].filter(Boolean).join(", ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coverage type confirmation panel */}
      {selectedPlace && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selectedPlace.address || "Sin dirección"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[selectedPlace.city, selectedPlace.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            ¿Cómo quieres cubrir esta ubicación?
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCoverageType("point")}
              className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-center transition-colors ${
                coverageType === "point"
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <p className="text-sm font-medium">Punto exacto (1km)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Radio de 1km
                {pricing != null && (
                  <> · {Number(pricing.point_credits)} créditos</>
                )}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setCoverageType("city")}
              className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-center transition-colors ${
                coverageType === "city"
                  ? "border-[#4A90D9] bg-[#4A90D9]/10"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <p className="text-sm font-medium">Toda la ciudad</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ciudad completa
                {pricing != null && (
                  <> · {Number(pricing.city_credits)} créditos</>
                )}
              </p>
            </button>
          </div>

          {locationCost != null && creditBalance != null && !canAfford && (
            <p className="text-xs text-red-600">
              Saldo insuficiente: necesitas {locationCost} créditos y tienes {creditBalance}.
            </p>
          )}

          {locationCost != null && canAfford && (
            <CreditsNonRefundableNotice variant="location-spend" className="text-[11px]" />
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedPlace(null)}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmAdd}
              disabled={isAdding || !canAfford}
              className="bg-[#4a6b1e] hover:bg-[#3d5a18] text-white"
            >
              {isAdding && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {locationCost != null
                ? `Agregar (${locationCost} créditos)`
                : "Agregar ubicación"}
            </Button>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border border-border/60 bg-muted/30"
        style={{ height: 400 }}
      />

      {/* Location list */}
      {loadingLocations ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Cargando ubicaciones...
        </div>
      ) : locations.length > 0 ? (
        <div className="space-y-2">
          {locations.map((loc) => {
            const isCity = loc.coverage_type === "city"
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">
                        {loc.place.address || "Sin dirección"}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isCity
                            ? "bg-[#4A90D9]/15 text-[#4A90D9]"
                            : "bg-[#FF6B35]/15 text-[#FF6B35]"
                        }`}
                      >
                        {isCity ? "Ciudad completa" : "Punto exacto"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {[loc.place.city, loc.place.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => requestRemoveLocation(loc)}
                  disabled={deletingId === loc.id}
                  className="shrink-0 rounded-full p-1 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  aria-label="Eliminar ubicación"
                >
                  {deletingId === loc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      ) : null}

      <Dialog
        open={locationPendingRemoval != null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setLocationPendingRemoval(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta ubicación?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-left">
                {locationPendingRemoval && (
                  <p className="text-sm text-foreground font-medium truncate">
                    {locationPendingRemoval.place.address || "Sin dirección"}
                  </p>
                )}
                <CreditsNonRefundableNotice
                  variant="location-remove"
                  creditsCharged={
                    locationPendingRemoval?.credits_charged != null
                      ? Number(locationPendingRemoval.credits_charged)
                      : null
                  }
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocationPendingRemoval(null)}
              disabled={Boolean(deletingId)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmRemoveLocation()}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar sin reembolso"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
