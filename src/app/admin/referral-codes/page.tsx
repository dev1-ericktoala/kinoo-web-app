"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { AdminReferralCodesTable } from "@/components/admin/admin-referral-codes-table"
import type { AdminReferralCode } from "@/types"

export default function AdminReferralCodesPage() {
  const [codes, setCodes] = useState<AdminReferralCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.referralCodes.list()
      setCodes(data)
    } catch {
      setError("No se pudieron cargar los códigos de referido.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Códigos de referido
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea códigos de campaña (ej. PRONACA2026) para que los usuarios los
          ingresen al registrarse en la app. Recibirán Puntos KYNOO según la
          configuración global del sistema. Los códigos personales de cada
          usuario siguen funcionando igual.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando códigos…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <AdminReferralCodesTable codes={codes} onCodesChange={setCodes} />
      )}
    </div>
  )
}
