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
} from "lucide-react"
import type { AuditLogEntry, PaginatedAuditLogs } from "@/types"

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
}

const LIMIT = 25

export default function AuditLogsPage() {
  const [result, setResult] = useState<PaginatedAuditLogs | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Filters (input = live text, query = committed to API)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [action, setAction] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.auditLogs({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        action: action || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setResult(data)
    } catch {
      setError("Error al cargar los logs de auditoría")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, action, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  function handleSearch() {
    setSearchQuery(searchInput)
    setPage(1)
  }

  function handleReset() {
    setSearchInput("")
    setSearchQuery("")
    setAction("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[#111827]">
        Logs de auditoría
      </h1>

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
              placeholder="Tabla, usuario, record ID, JSON..."
              className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Acción</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todas</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
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
          <div className="py-20 text-center">
            <p className="text-sm text-gray-400">
              No se encontraron registros de auditoría
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
                      Tabla
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cambios
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((log) => (
                    <AuditRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                {result.total} registro{result.total !== 1 && "s"} · Página{" "}
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

// ─── Audit Row ──────────────────────────────────────────

function AuditRow({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  const hasChanges = log.old_values || log.new_values

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
          {format(new Date(log.changed_at), "dd MMM yyyy HH:mm", {
            locale: es,
          })}
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
            {log.table_name}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}
          >
            {log.action}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-gray-500">
          {log.record_id.slice(0, 8)}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {log.changed_by_name || log.changed_by?.slice(0, 8) || "—"}
        </td>
        <td className="px-4 py-3">
          {hasChanges ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:underline"
            >
              {expanded ? "Ocultar" : "Ver cambios"}
            </button>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      </tr>
      {expanded && hasChanges && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-3">
            <div className="grid gap-4 sm:grid-cols-2">
              {log.old_values != null && (
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    Valores anteriores
                  </p>
                  <pre className="max-h-40 overflow-auto rounded bg-white border border-gray-200 p-2 text-[10px] text-gray-600">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                </div>
              )}
              {log.new_values != null && (
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    Valores nuevos
                  </p>
                  <pre className="max-h-40 overflow-auto rounded bg-white border border-gray-200 p-2 text-[10px] text-gray-600">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
