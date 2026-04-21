"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { adminApi } from "@/lib/admin-api"
import {
  ROUTES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_CATEGORY_COLORS,
} from "@/lib/constants"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Plus,
  MoreVertical,
  FileText,
  FileType,
  File,
  Eye,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { KnowledgeUploadModal } from "@/components/admin/knowledge-upload-modal"
import { KnowledgeEditModal } from "@/components/admin/knowledge-edit-modal"
import type {
  KnowledgeDocumentResponse,
  PaginatedKnowledgeDocuments,
} from "@/types"

const LIMIT = 25

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: "Listo", className: "bg-emerald-50 text-emerald-700" },
  processing: {
    label: "Procesando",
    className: "bg-amber-50 text-amber-700",
  },
  error: { label: "Error", className: "bg-red-50 text-red-600" },
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "pdf")
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />
  if (ext === "docx")
    return <FileType className="h-4 w-4 text-blue-500 shrink-0" />
  return <File className="h-4 w-4 text-gray-400 shrink-0" />
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return (
      <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-500">
        —
      </span>
    )
  }
  const color =
    KNOWLEDGE_CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800"
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  )
}

export default function KnowledgePage() {
  const [result, setResult] =
    useState<PaginatedKnowledgeDocuments | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Filters
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<KnowledgeDocumentResponse | null>(null)

  // Action menu
  const [openMenu, setOpenMenu] = useState<{
    id: string
    top: number
    left: number
  } | null>(null)

  const fetchDocs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.knowledge.list({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      })
      setResult(data)
    } catch {
      setError("Error al cargar los documentos")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  // Polling for processing docs
  useEffect(() => {
    const hasProcessing = result?.data.some((d) => d.status === "processing")
    if (!hasProcessing) return
    const interval = setInterval(fetchDocs, 10000)
    return () => clearInterval(interval)
  }, [result, fetchDocs])

  function handleSearch() {
    setSearchQuery(searchInput)
    setPage(1)
  }

  function handleReset() {
    setSearchInput("")
    setSearchQuery("")
    setCategoryFilter("")
    setStatusFilter("")
    setPage(1)
  }

  async function handleReprocess(id: string) {
    if (
      !confirm(
        "¿Reprocesar este documento? Se eliminarán los chunks actuales y se generarán nuevos.",
      )
    )
      return
    try {
      await adminApi.knowledge.reprocess(id)
      fetchDocs()
    } catch {
      alert("Error al reprocesar el documento")
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "¿Eliminar este documento y todos sus chunks? Esta acción no se puede deshacer.",
      )
    )
      return
    try {
      await adminApi.knowledge.delete(id)
      fetchDocs()
    } catch {
      alert("Error al eliminar el documento")
    }
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">
            Base de Conocimiento
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Documentos veterinarios para la IA — sube guías, protocolos y
            manuales.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Subir documento
        </button>
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
              placeholder="Título, descripción, archivo..."
              className="h-9 w-64 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todas</option>
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos</option>
              <option value="ready">Listo</option>
              <option value="processing">Procesando</option>
              <option value="error">Error</option>
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
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">
              No se encontraron documentos
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Título
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Chunks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Subido por
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Fecha
                    </th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.data.map((doc) => {
                    const sb =
                      STATUS_BADGE[doc.status] || STATUS_BADGE.processing
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={ROUTES.ADMIN_KNOWLEDGE_DETAIL(doc.id)}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {doc.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <FileIcon name={doc.file_name} />
                            <span className="truncate max-w-[150px] text-xs text-gray-600">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={doc.category} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${sb.className}`}
                          >
                            {doc.status === "processing" && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {sb.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.chunk_count}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.uploaded_by_name || "Sistema"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                          {format(
                            new Date(doc.created_at),
                            "dd MMM yyyy",
                            { locale: es },
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              if (openMenu?.id === doc.id) {
                                setOpenMenu(null)
                              } else {
                                const rect =
                                  e.currentTarget.getBoundingClientRect()
                                setOpenMenu({
                                  id: doc.id,
                                  top: rect.bottom + 4,
                                  left: rect.right - 160,
                                })
                              }
                            }}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                {result.total} documento{result.total !== 1 && "s"} · Página{" "}
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

      {/* Fixed dropdown menu */}
      {openMenu && (() => {
        const doc = result?.data.find((d) => d.id === openMenu.id)
        if (!doc) return null
        return (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenMenu(null)}
            />
            <div
              className="fixed z-50 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              style={{ top: openMenu.top, left: openMenu.left }}
            >
              <Link
                href={ROUTES.ADMIN_KNOWLEDGE_DETAIL(doc.id)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setOpenMenu(null)}
              >
                <Eye className="h-3.5 w-3.5" /> Ver
              </Link>
              <button
                onClick={() => {
                  setOpenMenu(null)
                  setEditDoc(doc)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                onClick={() => {
                  setOpenMenu(null)
                  handleReprocess(doc.id)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reprocesar
              </button>
              <button
                onClick={() => {
                  setOpenMenu(null)
                  handleDelete(doc.id)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </>
        )
      })()}

      {/* Modals */}
      <KnowledgeUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={fetchDocs}
      />
      <KnowledgeEditModal
        doc={editDoc}
        onClose={() => setEditDoc(null)}
        onSuccess={fetchDocs}
      />
    </div>
  )
}
