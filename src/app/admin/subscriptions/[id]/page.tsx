"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ActiveSubscriptionsPanel } from "@/components/admin/active-subscriptions-panel"
import { SubscriptionContractsPanel } from "@/components/admin/subscription-contracts-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminApi } from "@/lib/admin-api"
import { ROUTES } from "@/lib/constants"
import { useAdminUser } from "@/providers/admin-provider"

type TabValue = "active" | "contracts"

function SubscriptionFichaContent() {
  const params = useParams<{ id: string }>()
  const promotionId = params.id
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useAdminUser()
  const readOnlyContracts = user.role_code !== "admin"

  const tabFromUrl = searchParams.get("tab")
  const mainTab: TabValue =
    tabFromUrl === "contracts" ? "contracts" : "active"

  const [title, setTitle] = useState("Kynoo Pet Care")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await adminApi.petCareSubscriptions.list(promotionId)
        if (!cancelled) setTitle(data.promotion_title)
      } catch {
        // El título se queda en el fallback.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [promotionId])

  const description = useMemo(() => {
    if (mainTab === "contracts") {
      return readOnlyContracts
        ? "Historial de contratos y cargos. Solo visualización."
        : "Historial de contratos y cargos. El reembolso no cierra el contrato ni libera el cupo."
    }
    return "Contratos activos de esta ficha. Aquí se dejan las notas de seguimiento."
  }, [mainTab, readOnlyContracts])

  function setTab(next: TabValue) {
    const href =
      next === "contracts"
        ? `${ROUTES.ADMIN_SUBSCRIPTION_FICHA(promotionId)}?tab=contracts`
        : ROUTES.ADMIN_SUBSCRIPTION_FICHA(promotionId)
    router.replace(href)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN_SUBSCRIPTIONS}
          className="text-sm text-[#4a6b1e] hover:underline"
        >
          Suscripciones
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(value) =>
          setTab(value === "contracts" ? "contracts" : "active")
        }
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="active">Suscripciones activas</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0 space-y-4">
          <ActiveSubscriptionsPanel
            promotionId={promotionId}
            searchPlaceholder="Usuario o correo"
            emptyMessage="Esta ficha no tiene contratos activos."
          />
        </TabsContent>

        <TabsContent value="contracts" className="mt-0 space-y-4">
          <SubscriptionContractsPanel
            promotionId={promotionId}
            readOnly={readOnlyContracts}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SubscriptionFichaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Cargando...
        </div>
      }
    >
      <SubscriptionFichaContent />
    </Suspense>
  )
}
