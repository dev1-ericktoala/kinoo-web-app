"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { adminApi } from "@/lib/admin-api"
import { ROUTES, KNOWLEDGE_CATEGORY_COLORS } from "@/lib/constants"
import {
  Loader2,
  ChevronRight,
  Pencil,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
} from "lucide-react"
import { KnowledgeEditModal } from "@/components/admin/knowledge-edit-modal"
import { ChunkAccordion } from "@/components/admin/chunk-accordion"
import type { KnowledgeDocumentDetail } from "@/types"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: "Listo", className: "bg-emerald-50 text-emerald-700" },
  processing: {
    label: "Procesando",
    className: "bg-amber-50 text-amber-700",
  },
  error: { label: "Error", className: "bg-red-50 text-red-600" },
}

function humanizeSize(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function humanizeMime(mime: string | null): string {
  if (!mime) return "—"
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "text/plain": "Texto plano",
    "text/markdown": "Markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word (DOCX)",
  }
  return map[mime] || mime
}

export default function KnowledgeDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<KnowledgeDocumentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const fetchDoc = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminApi.knowledge.get(documentId)
      setDoc(data)
    } catch {
      setError("Error al cargar el documento")
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchDoc()
  }, [fetchDoc])

  // Poll while processing
  useEffect(() => {
    if (doc?.status !== "processing") return
    const interval = setInterval(fetchDoc, 10000)
    return () => clearInterval(interval)
  }, [doc?.status, fetchDoc])

  async function handleReprocess() {
    if (
      !confirm(
        "¿Reprocesar este documento? Se eliminarán los chunks actuales y se generarán nuevos.",
      )
    )
      return
    try {
      await adminApi.knowledge.reprocess(documentId)
      fetchDoc()
    } catch {
      alert("Error al reprocesar")
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "¿Eliminar este documento y todos sus chunks? Esta acción no se puede deshacer.",
      )
    )
      return
    try {
      await adminApi.knowledge.delete(documentId)
      router.push(ROUTES.ADMIN_KNOWLEDGE)
    } catch {
      alert("Error al eliminar")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <Link
          href={ROUTES.ADMIN_KNOWLEDGE}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Volver
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            {error || "Documento no encontrado"}
          </p>
        </div>
      </div>
    )
  }

  const sb = STATUS_BADGE[doc.status] || STATUS_BADGE.processing
  const catColor =
    KNOWLEDGE_CATEGORY_COLORS[doc.category || ""] ||
    "bg-gray-100 text-gray-500"
  const errorMsg =
    doc.status === "error" &&
    doc.doc_metadata &&
    typeof doc.doc_metadata.error === "string"
      ? doc.doc_metadata.error
      : null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Link
          href={ROUTES.ADMIN_KNOWLEDGE}
          className="hover:text-gray-700 transition-colors"
        >
          Base de Conocimiento
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium truncate max-w-[300px]">
          {doc.title}
        </span>
      </div>

      {/* Header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-[#111827]">{doc.title}</h1>
        <div className="flex items-center gap-2">
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </a>
          )}
          <button
            onClick={() => setEditOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            onClick={handleReprocess}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reprocesar
          </button>
          <button
            onClick={handleDelete}
            className="flex h-9 items-center gap-2 rounded-lg border border-red-300 px-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Status banners */}
      {doc.status === "processing" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          <p className="text-sm text-amber-700">
            Este documento se está procesando. Los chunks estarán disponibles
            en unos momentos.
          </p>
        </div>
      )}
      {doc.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Error al procesar el documento
            </p>
            {errorMsg && (
              <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* Metadata card */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <MetaField label="Título" value={doc.title} />
          <MetaField
            label="Descripción"
            value={doc.description || "Sin descripción"}
            className="sm:col-span-2"
          />
          <MetaField label="Archivo">
            {doc.file_url ? (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {doc.file_name}
              </a>
            ) : (
              doc.file_name
            )}
          </MetaField>
          <MetaField label="Tipo" value={humanizeMime(doc.mime_type)} />
          <MetaField label="Tamaño" value={humanizeSize(doc.file_size)} />
          <MetaField label="Categoría">
            {doc.category ? (
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${catColor}`}
              >
                {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
              </span>
            ) : (
              "—"
            )}
          </MetaField>
          <MetaField label="Estado">
            <span
              className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${sb.className}`}
            >
              {doc.status === "processing" && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {sb.label}
            </span>
          </MetaField>
          <MetaField label="Chunks" value={String(doc.chunk_count)} />
          <MetaField
            label="Subido por"
            value={doc.uploaded_by_name || "Sistema"}
          />
          <MetaField
            label="Fecha creación"
            value={format(new Date(doc.created_at), "dd MMM yyyy HH:mm", {
              locale: es,
            })}
          />
          <MetaField
            label="Última actualización"
            value={format(new Date(doc.updated_at), "dd MMM yyyy HH:mm", {
              locale: es,
            })}
          />
        </div>
      </div>

      {/* Chunks */}
      {doc.chunks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#111827]">
            Chunks ({doc.chunk_count})
          </h2>
          <ChunkAccordion chunks={doc.chunks} />
        </div>
      )}

      {/* Edit modal */}
      <KnowledgeEditModal
        doc={editOpen ? doc : null}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchDoc}
      />
    </div>
  )
}

function MetaField({
  label,
  value,
  children,
  className,
}: {
  label: string
  value?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="mt-0.5 text-sm text-gray-900">
        {children || value || "—"}
      </div>
    </div>
  )
}
