"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { adminApi } from "@/lib/admin-api"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
  RotateCcw,
} from "lucide-react"
import type { PaginatedActiveCredits } from "@/types"

const LIMIT = 25

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  expired: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  expired: "Expirado",
  pending: "Pendiente",
}

function statusStyle(status: string) {
  return STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] || status
}

export default function EmergencyCreditsPage() {
  const [result, setResult] = useState<PaginatedActiveCredits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCredits = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.credits({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        sort_by: "deactivated_at",
        sort_order: "desc",
      })
      setResult(data)
    } catch {
      setError("Error al cargar los créditos de emergencia")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleSearch() {
    setSearchQuery(searchInput)
    setPage(1)
  }

  function handleReset() {
    setSearchInput("")
    setSearchQuery("")
    setStatusFilter("")
    setPage(1)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-[#111827]">
          Créditos de emergencia
        </h1>
        {result && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            {result.total} total{result.total !== 1 && "es"}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Buscar</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nombre, email, ID, estado..."
              className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="expired">Expirado</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Buscar
          </button>
          <button
            onClick={handleReset}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
          <p className="pb-1.5 text-xs text-gray-400">
            Ordenado por fecha de desactivación (más reciente primero)
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !result || result.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Phone className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">
              No se encontraron créditos de emergencia
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Activado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Desactivado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((credit) => (
                    <tr
                      key={credit.credit_id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                            {credit.user_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {credit.user_name || "—"}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400">
                              {credit.user_id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {credit.user_email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle(credit.status)}`}
                        >
                          {statusLabel(credit.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {credit.activated_at
                          ? format(
                              new Date(credit.activated_at),
                              "dd MMM yyyy HH:mm",
                              { locale: es },
                            )
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {credit.deactivated_at
                          ? format(
                              new Date(credit.deactivated_at),
                              "dd MMM yyyy HH:mm",
                              { locale: es },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {result.data.map((credit) => (
                <div key={credit.credit_id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {credit.user_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {credit.user_name || "—"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {credit.user_email}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle(credit.status)}`}
                    >
                      {statusLabel(credit.status)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {credit.activated_at && (
                      <span>
                        Activado:{" "}
                        {format(
                          new Date(credit.activated_at),
                          "dd MMM yyyy",
                          { locale: es },
                        )}
                      </span>
                    )}
                    {credit.deactivated_at && (
                      <span>
                        Desactivado:{" "}
                        {format(
                          new Date(credit.deactivated_at),
                          "dd MMM yyyy",
                          { locale: es },
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                {result.total} crédito{result.total !== 1 && "s"} · Página{" "}
                {page} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
