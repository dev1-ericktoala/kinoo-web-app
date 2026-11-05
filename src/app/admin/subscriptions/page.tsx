"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Film, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { ROUTES } from "@/lib/constants"
import type { AdminSubscriptionPublication } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

function day(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, "dd MMM yyyy", { locale: es })
}

function coverUrl(row: AdminSubscriptionPublication): string | null {
  const isVideo =
    row.media_type === "video" ||
    (row.media_type !== "image" && Boolean(row.video_thumbnail_url))
  if (isVideo && row.video_thumbnail_url) return row.video_thumbnail_url
  if (row.image_url) return row.image_url
  if (row.video_thumbnail_url) return row.video_thumbnail_url
  return null
}

function isVideoRow(row: AdminSubscriptionPublication): boolean {
  return (
    row.media_type === "video" ||
    (Boolean(row.video_thumbnail_url) && !row.image_url)
  )
}

function FichaThumb({
  row,
  onOpen,
}: {
  row: AdminSubscriptionPublication
  onOpen: (row: AdminSubscriptionPublication) => void
}) {
  const src = coverUrl(row)
  const video = isVideoRow(row)

  if (!src) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400">
        —
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onOpen(row)
      }}
      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4a6b1e]/40 focus-visible:ring-offset-1"
      title={video ? "Ver miniatura" : "Ver imagen"}
      aria-label={video ? `Ver miniatura de ${row.title}` : `Ver imagen de ${row.title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {video ? (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 p-0.5">
          <Film className="h-2.5 w-2.5 text-white" />
        </span>
      ) : null}
    </button>
  )
}

export default function SubscriptionsHubPage() {
  const [rows, setRows] = useState<AdminSubscriptionPublication[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<AdminSubscriptionPublication | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.petCareSubscriptions.publications({
        page,
        limit: PAGE_SIZE,
      })
      setRows(data.items)
      setTotal(data.total)
    } catch {
      setError("No se pudieron cargar las fichas de suscripción.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const previewSrc = preview ? coverUrl(preview) : null
  const previewIsVideo = preview ? isVideoRow(preview) : false

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Suscripciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Fichas de Kynoo Pet Care. Entra a una para ver suscripciones activas
            (con notas) y el historial de contratos.
            {total > 0 ? (
              <span className="text-gray-400"> · {total} en total</span>
            ) : null}
          </p>
        </div>
        <Link
          href={ROUTES.ADMIN_SUBSCRIPTIONS_ALL_ACTIVE}
          className="text-sm font-medium text-[#4a6b1e] hover:underline"
        >
          Ver todas las activas
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Cargando fichas...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          Todavía no hay fichas de suscripción.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs font-medium">Ficha</TableHead>
                <TableHead className="text-xs font-medium">Estado</TableHead>
                <TableHead className="text-xs font-medium">Activas</TableHead>
                <TableHead className="text-xs font-medium">Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <FichaThumb row={row} onOpen={setPreview} />
                      <Link
                        href={ROUTES.ADMIN_SUBSCRIPTION_FICHA(row.id)}
                        className="flex min-w-0 items-center gap-1 font-medium text-gray-900 hover:underline"
                        title={`Abrir: ${row.title}`}
                      >
                        <span className="truncate">{row.title}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-700" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${
                        row.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200"
                      }`}
                    >
                      {row.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-gray-700">
                    {row.active_contracts}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {day(row.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
            <span>
              {total} ficha{total === 1 ? "" : "s"} · página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={preview != null}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base">
              {preview?.title ?? "Vista previa"}
            </DialogTitle>
            <DialogDescription>
              {previewIsVideo
                ? "Miniatura del video de la ficha."
                : "Vista previa de la imagen de la ficha."}
            </DialogDescription>
          </DialogHeader>
          {previewSrc ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={preview?.title ?? ""}
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
