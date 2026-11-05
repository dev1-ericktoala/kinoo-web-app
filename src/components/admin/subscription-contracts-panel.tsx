"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { ApiError } from "@/lib/api-client"
import type {
  AdminSubscriptionCharge,
  AdminSubscriptionContract,
  AdminSubscriptionContractDetail,
} from "@/types"
import { CheckoutSnapshotView } from "@/components/admin/checkout-snapshot-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_LABELS: Record<string, string> = {
  incomplete: "Incompleto",
  active: "Activo",
  past_due: "Pago pendiente",
  action_required: "Verificación pendiente",
  paused: "Pausado",
  cancelled: "Cancelado",
  expired: "Vencido",
  pending: "Pendiente",
  processing: "En proceso",
  paid: "Pagado",
  failed: "Rechazado",
  refunded: "Reembolsado",
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  incomplete: "bg-zinc-50 text-zinc-500 border-zinc-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  past_due: "bg-amber-50 text-amber-700 border-amber-200",
  action_required: "bg-sky-50 text-sky-700 border-sky-200",
  paused: "bg-amber-50 text-amber-800 border-amber-200",
  cancelled: "bg-zinc-50 text-zinc-500 border-zinc-200",
  expired: "bg-zinc-50 text-zinc-500 border-zinc-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-violet-50 text-violet-700 border-violet-200",
}

const KIND_LABELS: Record<string, string> = {
  initial: "Alta",
  renewal: "Renovación",
  interval_change: "Paso a anual",
}

function displayStatus(row: AdminSubscriptionContract): string {
  if (row.cancel_at_period_end) return "cancelled"
  return row.status
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASS[status] || "bg-zinc-50 text-zinc-500 border-zinc-200"
}

function day(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, "dd MMM yyyy", { locale: es })
}

function money(value: number | string): string {
  return Number(value).toFixed(2)
}

interface SubscriptionContractsPanelProps {
  promotionId: string
  /** Si true, no se muestra reembolso (Operador IGS). */
  readOnly?: boolean
}

export function SubscriptionContractsPanel({
  promotionId,
  readOnly = false,
}: SubscriptionContractsPanelProps) {
  const [rows, setRows] = useState<AdminSubscriptionContract[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminSubscriptionContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refundCharge, setRefundCharge] = useState<AdminSubscriptionCharge | null>(null)
  const [reason, setReason] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.petCareSubscriptions.list(promotionId)
      setRows(data.items)
    } catch {
      setError("No se pudieron cargar los contratos.")
    } finally {
      setLoading(false)
    }
  }, [promotionId])

  useEffect(() => {
    void load()
  }, [load])

  async function openContract(id: string) {
    if (openId === id) {
      setOpenId(null)
      setDetail(null)
      return
    }
    setOpenId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      setDetail(await adminApi.petCareSubscriptions.get(id))
    } catch {
      setError("No se pudo cargar el historial de cargos.")
      setOpenId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  async function confirmRefund() {
    if (readOnly || !refundCharge || !openId) return
    const text = reason.trim()
    if (!text) {
      setRefundError("El motivo es obligatorio.")
      return
    }
    setRefundLoading(true)
    setRefundError(null)
    try {
      await adminApi.petCareSubscriptions.refund(refundCharge.id, text)
      setRefundCharge(null)
      setReason("")
      setDetail(await adminApi.petCareSubscriptions.get(openId))
      await load()
    } catch (err) {
      setRefundError(
        err instanceof ApiError ? err.message : "No se pudo reembolsar el cargo.",
      )
    } finally {
      setRefundLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Cargando contratos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
        Esta ficha todavía no tiene contratos.
      </div>
    )
  }

  return (
    <>
      {readOnly ? (
        <p className="mb-3 text-xs text-gray-500">
          Solo lectura. El reembolso de un cargo lo hace el administrador.
        </p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-xs font-medium">Usuario</TableHead>
              <TableHead className="text-xs font-medium">Intervalo</TableHead>
              <TableHead className="text-xs font-medium">Estado</TableHead>
              <TableHead className="text-xs font-medium">Periodo</TableHead>
              <TableHead className="text-xs font-medium">Próximo cobro</TableHead>
              <TableHead className="text-xs font-medium">Intentos</TableHead>
              <TableHead className="text-xs font-medium" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow>
                  <TableCell className="text-sm">
                    <div className="font-medium text-gray-900">{row.user_name}</div>
                    <div className="text-xs text-gray-500">{row.user_email}</div>
                    <CheckoutSnapshotView
                      snapshot={row.checkout_snapshot}
                      compact
                      className="mt-1"
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.interval === "yearly" ? "Anual" : "Mensual"}
                    <div className="text-xs text-gray-500">USD {money(row.amount_usd)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${statusBadgeClass(displayStatus(row))}`}
                    >
                      {statusLabel(displayStatus(row))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {day(row.current_period_start)} — {day(row.current_period_end)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {row.cancel_at_period_end || row.status === "cancelled"
                      ? "—"
                      : day(row.next_charge_at)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{row.failed_attempts}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void openContract(row.id)}
                    >
                      {openId === row.id ? "Ocultar cargos" : "Ver cargos"}
                    </Button>
                  </TableCell>
                </TableRow>
                {openId === row.id ? (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-gray-50">
                      {detailLoading || !detail ? (
                        <div className="flex items-center py-4 text-sm text-gray-500">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando cargos...
                        </div>
                      ) : detail.charges.length === 0 ? (
                        <p className="py-3 text-sm text-gray-500">Sin cargos.</p>
                      ) : (
                        <div className="space-y-3 py-2">
                          <CheckoutSnapshotView snapshot={detail.checkout_snapshot} />
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Tipo</TableHead>
                                <TableHead className="text-xs">Estado</TableHead>
                                <TableHead className="text-xs">Monto</TableHead>
                                <TableHead className="text-xs">Facturación</TableHead>
                                <TableHead className="text-xs">Transaction ID</TableHead>
                                <TableHead className="text-xs">Authorization Code</TableHead>
                                {!readOnly ? (
                                  <TableHead className="text-xs" />
                                ) : null}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {detail.charges.map((charge) => (
                                <TableRow key={charge.id}>
                                  <TableCell className="text-sm">
                                    {KIND_LABELS[charge.kind] || charge.kind}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs font-normal ${statusBadgeClass(charge.status)}`}
                                    >
                                      {statusLabel(charge.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    USD {money(charge.amount_usd)}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <CheckoutSnapshotView
                                      snapshot={charge.checkout_snapshot}
                                      compact
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {charge.nuvei_transaction_id || "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {charge.authorization_code || "—"}
                                  </TableCell>
                                  {!readOnly ? (
                                    <TableCell>
                                      {charge.refundable ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setRefundError(null)
                                            setReason("")
                                            setRefundCharge(charge)
                                          }}
                                        >
                                          Reembolsar
                                        </Button>
                                      ) : null}
                                    </TableCell>
                                  ) : null}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly ? (
        <Dialog
          open={refundCharge != null}
          onOpenChange={(open) => {
            if (!open && !refundLoading) setRefundCharge(null)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reembolsar cargo</DialogTitle>
              <DialogDescription>
                {refundCharge
                  ? `Se reversan USD ${money(refundCharge.amount_usd)} en Nuvei. El contrato sigue igual y el cupo no se libera.`
                  : null}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo del reembolso"
              maxLength={500}
            />
            {refundError ? (
              <p className="text-sm text-red-700">{refundError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={refundLoading}
                onClick={() => setRefundCharge(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={refundLoading}
                onClick={() => void confirmRefund()}
              >
                {refundLoading ? "Reembolsando..." : "Reembolsar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
