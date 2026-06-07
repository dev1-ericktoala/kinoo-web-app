"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { AdminAppUsersTable } from "@/components/admin/admin-app-users-table"
import type { AdminAppUserListItem } from "@/types"

export default function AdminAppUsersPage() {
  const [users, setUsers] = useState<AdminAppUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.appUsers.list({ limit: 500 })
      setUsers(data.items)
      setTotal(data.total)
    } catch {
      setError("No se pudieron cargar los usuarios de la app.")
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
        <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tutores de la app móvil con rol{" "}
          <span className="font-medium text-indigo-700">Owner</span> o{" "}
          <span className="font-medium text-rose-700">Member</span>.
          {total > 0 ? (
            <span className="text-gray-400"> · {total} en total</span>
          ) : null}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando usuarios…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <AdminAppUsersTable users={users} onUsersChange={setUsers} />
      )}
    </div>
  )
}
