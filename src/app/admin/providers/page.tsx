"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { AdminProvidersTable } from "@/components/admin/admin-providers-table"
import type { AdminProviderListItem } from "@/types"

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProviderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.providers.list({ limit: 500 })
      setProviders(data.items)
    } catch {
      setError("No se pudieron cargar los proveedores.")
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
        <h1 className="text-xl font-semibold text-gray-900">Proveedores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea cuentas de proveedor para el panel web. El primer acceso es con
          OTP al correo registrado; tras verificar, la cuenta queda activada.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando proveedores…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <AdminProvidersTable
          providers={providers}
          onProvidersChange={setProviders}
        />
      )}
    </div>
  )
}
