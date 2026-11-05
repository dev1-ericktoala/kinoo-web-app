"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ROUTES } from "@/lib/constants"

/** Compatibilidad: la vista global de activas vive en /admin/subscriptions/active. */
export default function ActiveSubscriptionsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.ADMIN_SUBSCRIPTIONS_ALL_ACTIVE)
  }, [router])

  return (
    <div className="flex items-center justify-center py-16 text-gray-500">
      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
      Redirigiendo...
    </div>
  )
}
