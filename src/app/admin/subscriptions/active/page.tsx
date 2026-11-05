"use client"

import Link from "next/link"
import { ActiveSubscriptionsPanel } from "@/components/admin/active-subscriptions-panel"
import { ROUTES } from "@/lib/constants"

export default function AllActiveSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN_SUBSCRIPTIONS}
          className="text-sm text-[#4a6b1e] hover:underline"
        >
          Suscripciones
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">
          Todas las activas
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Contratos activos de todas las fichas de Kynoo Pet Care. El admin y el
          Operador IGS pueden dejar notas aquí.
        </p>
      </div>
      <ActiveSubscriptionsPanel />
    </div>
  )
}
