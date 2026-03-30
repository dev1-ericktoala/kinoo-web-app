"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentPromotions } from "@/components/dashboard/recent-promotions"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Megaphone,
  CheckCircle2,
  BarChart3,
  Clock,
} from "lucide-react"
import type { Promotion } from "@/types"

export default function DashboardPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
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
    }
    load()
  }, [toast])

  const totalCount = promotions.length
  const activeCount = promotions.filter(
    (p) => p.is_active && p.status === "active",
  ).length
  const totalRedemptions = promotions.reduce(
    (sum, p) => sum + (p.redemptions_count || 0),
    0,
  )
  const now = new Date()
  const endingSoonCount = promotions.filter((p) => {
    const end = new Date(p.end_date)
    const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return p.is_active && diffDays > 0 && diffDays <= 7
  }).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total publicaciones"
          value={totalCount}
          icon={Megaphone}
        />
        <StatsCard
          title="Activas"
          value={activeCount}
          icon={CheckCircle2}
          description={`de ${totalCount} publicaciones`}
        />
        <StatsCard
          title="Canjes totales"
          value={totalRedemptions}
          icon={BarChart3}
        />
        <StatsCard
          title="Por vencer"
          value={endingSoonCount}
          icon={Clock}
          description="en los próximos 7 días"
        />
      </div>

      <RecentPromotions promotions={promotions} />
    </div>
  )
}
