"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { ROUTES } from "@/lib/constants"
import { ReservationStatusBadge } from "@/components/reservations/reservation-status-badge"
import { ReservationFulfillmentPanel } from "@/components/reservations/reservation-fulfillment-panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import type { PromotionPaidOrder } from "@/types"

function formatUsd(value: number | string) {
  return Number(value).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  })
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es })
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 py-3 border-b border-border/60 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value}</dd>
    </div>
  )
}

export default function ReservationDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { toast } = useToast()
  const [order, setOrder] = useState<PromotionPaidOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.reservations.get(orderId)
      setOrder(data)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la reserva.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-9 w-[200px]" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.RESERVATIONS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a reservas
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Reserva no encontrada.</p>
      </div>
    )
  }

  const buyerPhone = order.buyer_phone?.trim()

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={ROUTES.RESERVATIONS}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a reservas
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {order.promotion_title_snapshot}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Referencia {order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <ReservationStatusBadge status={order.status} />
      </div>

      <section className="rounded-lg border border-border/60 p-5 space-y-1">
        <h3 className="text-sm font-semibold mb-2">Cliente</h3>
        <dl>
          <DetailRow label="Nombre" value={order.buyer_full_name} />
          <DetailRow
            label="Email"
            value={
              <a
                href={`mailto:${order.buyer_email}`}
                className="inline-flex items-center gap-1.5 text-[#4a6b1e] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {order.buyer_email}
              </a>
            }
          />
          <DetailRow
            label="Teléfono"
            value={
              buyerPhone ? (
                <a
                  href={`tel:${buyerPhone}`}
                  className="inline-flex items-center gap-1.5 text-[#4a6b1e] hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {buyerPhone}
                </a>
              ) : (
                "No indicado"
              )
            }
          />
          <DetailRow
            label="Notas"
            value={order.notes?.trim() || "Sin notas adicionales"}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-border/60 p-5 space-y-1">
        <h3 className="text-sm font-semibold mb-2">Pago</h3>
        <dl>
          <DetailRow label="Monto" value={formatUsd(order.amount_usd)} />
          <DetailRow label="Pagado el" value={formatDate(order.paid_at)} />
          <DetailRow label="Creada el" value={formatDate(order.created_at)} />
          {order.nuvei_transaction_id && (
            <DetailRow
              label="Transaction ID"
              value={
                <span className="font-mono text-xs">{order.nuvei_transaction_id}</span>
              }
            />
          )}
        </dl>
      </section>

      <ReservationFulfillmentPanel order={order} onUpdated={setOrder} />
    </div>
  )
}
