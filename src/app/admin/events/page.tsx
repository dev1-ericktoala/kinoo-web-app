"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { adminApi } from "@/lib/admin-api"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Activity,
} from "lucide-react"
import type { EventEntry, PaginatedEvents } from "@/types"

const LIMIT = 25

export default function EventsPage() {
  const [result, setResult] = useState<PaginatedEvents | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Filters (input = live text, query = committed to API)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.events({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setResult(data)
    } catch {
      setError("Error al cargar los eventos")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, dateFrom, dateTo])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function handleSearch() {
    setSearchQuery(searchInput)
    setPage(1)
  }

  function handleReset() {
    setSearchInput("")
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[#111827]">Eventos</h1>

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
              placeholder="Tipo evento, entidad, ID, payload..."
              className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !result || result.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">
              No se encontraron eventos
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tipo evento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tipo entidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Entity ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Payload
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                {result.total} evento{result.total !== 1 && "s"} · Página{" "}
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

// ─── Event Row ──────────────────────────────────────────

function EventRow({ event }: { event: EventEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
          {format(new Date(event.created_at), "dd MMM yyyy HH:mm", {
            locale: es,
          })}
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            {event.event_type}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
            {event.entity_type}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-gray-500">
          {event.entity_id.slice(0, 8)}
        </td>
        <td className="px-4 py-3">
          {event.payload ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:underline"
            >
              {expanded ? "Ocultar" : "Ver payload"}
            </button>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      </tr>
      {expanded && event.payload && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <pre className="max-h-48 overflow-auto rounded bg-white border border-gray-200 p-3 text-[11px] text-gray-600">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}
