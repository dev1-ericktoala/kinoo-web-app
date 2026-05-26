"use client"

import { useContext } from "react"
import { ProviderCreditsContext } from "@/providers/provider-credits-provider"

export function useProviderCredits() {
  const context = useContext(ProviderCreditsContext)
  if (!context) {
    throw new Error(
      "useProviderCredits must be used within a ProviderCreditsProvider",
    )
  }
  return context
}
