"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { ROUTES } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { PromotionForm } from "@/components/promotions/promotion-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Promotion } from "@/types"

export default function EditPromotionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.promotions.get(params.id as string)
        setPromotion(data)
      } catch {
        setNotFound(true)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Publicación no encontrada.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) load()
  }, [params.id, toast])

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[100px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    )
  }

  if (notFound || !promotion) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground mb-4">
          Publicación no encontrada
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(ROUTES.PROMOTIONS)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a promociones
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Editar publicación</h2>
      <PromotionForm initialData={promotion} mode="edit" />
    </div>
  )
}
