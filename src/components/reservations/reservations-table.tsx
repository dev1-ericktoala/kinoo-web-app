"use client"

import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReservationStatusBadge } from "./reservation-status-badge"
import { FulfillmentPhaseBadge } from "./fulfillment-phase-badge"
import { ChevronRight } from "lucide-react"
import type { PromotionPaidOrder } from "@/types"

interface ReservationsTableProps {
  items: PromotionPaidOrder[]
  searchQuery?: string
}

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

export function ReservationsTable({ items, searchQuery }: ReservationsTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center rounded-lg border border-border/60">
        {searchQuery
          ? "No hay reservas que coincidan con tu búsqueda."
          : "Aún no tienes reservas pagadas. Cuando un cliente pague por uno de tus servicios, aparecerá aquí."}
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Servicio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="w-[48px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium max-w-[200px]">
                <span className="line-clamp-2">{order.promotion_title_snapshot}</span>
                <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate">{order.buyer_full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.buyer_email}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <ReservationStatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                {order.status === "paid" ? (
                  <FulfillmentPhaseBadge phase={order.fulfillment_phase} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDate(order.paid_at || order.created_at)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatUsd(order.amount_usd)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={ROUTES.RESERVATION_DETAIL(order.id)}
                    aria-label="Ver detalle"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
