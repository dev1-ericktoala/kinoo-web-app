"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { PromotionsTable } from "@/components/promotions/promotions-table"
import { Skeleton } from "@/components/ui/skeleton"
import type { Promotion } from "@/types"

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const load = useCallback(async () => {
    try {
      const data = await api.promotions.list(true)
      setPromotions(data)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las promociones.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  function handlePromotionUpdated(
    id: string,
    updates: Partial<Promotion>,
  ) {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-[300px]" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  return (
    <PromotionsTable
      promotions={promotions}
      onPromotionUpdated={handlePromotionUpdated}
    />
  )
}
