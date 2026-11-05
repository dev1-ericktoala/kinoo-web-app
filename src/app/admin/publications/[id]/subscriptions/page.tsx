"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/constants"

/** Compatibilidad: Contratos desde Publicaciones → hub de Suscripciones. */
export default function PublicationSubscriptionsRedirectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.ADMIN_SUBSCRIPTION_CONTRACTS(params.id))
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center py-16 text-gray-500">
      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
      Redirigiendo a Contratos...
    </div>
  )
}
