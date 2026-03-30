"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import type { Country, City } from "@/types"

export function useLookup() {
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  useEffect(() => {
    async function loadCountries() {
      setIsLoadingCountries(true)
      try {
        const data = await api.lookup.countries()
        setCountries(data)
      } catch {
        // silently fail — countries list is non-critical
      } finally {
        setIsLoadingCountries(false)
      }
    }
    loadCountries()
  }, [])

  const loadCities = useCallback(async (countryId: string | null) => {
    if (!countryId) {
      setCities([])
      return
    }
    setIsLoadingCities(true)
    try {
      const data = await api.lookup.cities(countryId)
      setCities(data)
    } catch {
      setCities([])
    } finally {
      setIsLoadingCities(false)
    }
  }, [])

  return {
    countries,
    cities,
    isLoadingCountries,
    isLoadingCities,
    loadCities,
  }
}
