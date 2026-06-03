"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react"
import { api } from "@/lib/api-client"
import { ProviderCsvExportDialog } from "@/components/reservations/provider-csv-export-dialog"
import { ReservationsTable } from "@/components/reservations/reservations-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  ADMIN_FILTER_INPUT_CLASS,
  ADMIN_FILTER_LABEL_CLASS,
  ADMIN_FILTER_PANEL_CLASS,
} from "@/lib/constants"
import type { PromotionPaidOrder, PromotionOrderFulfillmentPhase } from "@/types"

type FilterTab = "paid" | "all" | "pending"
type PhaseFilter = "" | PromotionOrderFulfillmentPhase

const LIMIT = 25

export default function ReservationsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<PromotionPaidOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<FilterTab>("paid")
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("")
  const [searchInput, setSearchInput] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [dateFromInput, setDateFromInput] = useState("")
  const [dateToInput, setDateToInput] = useState("")
  const [appliedDateFrom, setAppliedDateFrom] = useState("")
  const [appliedDateTo, setAppliedDateTo] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const orderStatus = tab === "paid" ? "paid" : tab === "all" ? undefined : undefined
      const res = await api.reservations.list(
        LIMIT,
        (page - 1) * LIMIT,
        orderStatus,
        appliedSearch || undefined,
        tab === "paid" && phaseFilter ? phaseFilter : undefined,
        appliedDateFrom || undefined,
        appliedDateTo || undefined,
      )
      let nextItems = res.items
      if (tab === "pending") {
        nextItems = res.items.filter((o) =>
          ["pending", "processing"].includes(o.status),
        )
      }
      setItems(nextItems)
      setTotal(tab === "pending" ? nextItems.length : res.total)
    } catch {
      setError("No se pudieron cargar las reservas")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las reservas.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [
    tab,
    page,
    appliedSearch,
    phaseFilter,
    appliedDateFrom,
    appliedDateTo,
    toast,
  ])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  useEffect(() => {
    if (tab !== "paid") setPhaseFilter("")
    setPage(1)
  }, [tab])

  function handleSearchSubmit(e?: FormEvent) {
    e?.preventDefault()
    if (dateFromInput && dateToInput && dateFromInput > dateToInput) {
      setError("La fecha inicial no puede ser mayor que la fecha final.")
      return
    }
    setError(null)
    setAppliedSearch(searchInput.trim())
    setAppliedDateFrom(dateFromInput)
    setAppliedDateTo(dateToInput)
    setPage(1)
  }

  function handleReset() {
    setSearchInput("")
    setAppliedSearch("")
    setDateFromInput("")
    setDateToInput("")
    setAppliedDateFrom("")
    setAppliedDateTo("")
    setPhaseFilter("")
    setPage(1)
    setError(null)
  }

  function exportInitialOrderStatus() {
    if (tab === "paid") return "paid"
    return ""
  }

  const totalPages = tab === "pending" ? 1 : Math.ceil(total / LIMIT) || 0
  const showSearching = isLoading
  const countLabel = showSearching
    ? "Buscando..."
    : total === 1
      ? "1 reserva"
      : `${total} reservas`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">Reservas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reservas pagadas por clientes desde la app móvil. Contacta al
            comprador para coordinar fecha y lugar.
          </p>
        </div>
        <div className="flex w-full flex-col items-end gap-2 sm:w-auto sm:shrink-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList className="h-9">
              <TabsTrigger value="paid">Pagadas</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="h-9 shrink-0"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {tab === "paid" ? (
        <Tabs
          value={phaseFilter || "all_phases"}
          onValueChange={(v) => {
            setPhaseFilter(v === "all_phases" ? "" : (v as PhaseFilter))
            setPage(1)
          }}
        >
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="all_phases" className="text-xs">
              Todas
            </TabsTrigger>
            <TabsTrigger value="pending_contact" className="text-xs">
              Por contactar
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs">
              Agendadas
            </TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs">
              En revisión
            </TabsTrigger>
            <TabsTrigger value="verified" className="text-xs">
              Verificadas
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">
              Rechazadas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <div className={ADMIN_FILTER_PANEL_CLASS}>
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[200px] flex-1 max-w-md space-y-1">
            <label className={ADMIN_FILTER_LABEL_CLASS}>Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Referencia o cliente…"
                className={`${ADMIN_FILTER_INPUT_CLASS} pl-9`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={ADMIN_FILTER_LABEL_CLASS}>Desde</label>
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              className={ADMIN_FILTER_INPUT_CLASS}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className={ADMIN_FILTER_LABEL_CLASS}>Hasta</label>
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              className={ADMIN_FILTER_INPUT_CLASS}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {isLoading && appliedSearch ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Buscar
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {showSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {countLabel}
        </span>
        {totalPages > 1 && !isLoading && tab !== "pending" && (
          <span>
            Página {page} de {totalPages}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center py-2">
            Buscando reservas...
          </p>
          <Skeleton className="h-[360px] rounded-lg" />
        </div>
      ) : (
        <>
          <ReservationsTable items={items} searchQuery={appliedSearch} />

          {totalPages > 1 && tab !== "pending" && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ProviderCsvExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        initialOrderStatus={exportInitialOrderStatus()}
        initialFulfillmentPhase={tab === "paid" ? phaseFilter : ""}
        onDownload={(filters) =>
          api.reservations.exportCsv({
            order_status: filters.orderStatus || undefined,
            fulfillment_phase: filters.fulfillmentPhase || undefined,
            search: appliedSearch || undefined,
            date_from: filters.dateFrom || undefined,
            date_to: filters.dateTo || undefined,
          })
        }
      />
    </div>
  )
}
