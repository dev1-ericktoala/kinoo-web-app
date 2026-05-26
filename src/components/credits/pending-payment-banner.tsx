"use client"

import { CreditCard, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CREDIT_ORDER_STATUS_LABELS } from "@/lib/constants"
import type { ProviderCreditOrder } from "@/types"

interface PendingPaymentBannerProps {
  order: ProviderCreditOrder
  checkoutUrl: string | null
  isPolling: boolean
  onDismiss: () => void
  onOpenCheckout?: () => void
}

export function PendingPaymentBanner({
  order,
  checkoutUrl,
  isPolling,
  onDismiss,
  onOpenCheckout,
}: PendingPaymentBannerProps) {
  const statusLabel =
    CREDIT_ORDER_STATUS_LABELS[order.status] || order.status

  const isPaid = order.status === "paid"
  const isFailed = order.status === "failed" || order.status === "expired"
  const awaitingCheckout = !isPaid && !isFailed && !checkoutUrl

  const boxClass = isPaid
    ? "border-emerald-200 bg-emerald-50"
    : isFailed
      ? "border-red-200 bg-red-50"
      : awaitingCheckout
        ? "border-slate-200 bg-slate-50"
        : "border-amber-200 bg-amber-50"

  return (
    <div
      className={`rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${boxClass}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {isPaid
            ? "Pago confirmado"
            : isFailed
              ? "El pago no se completó"
              : awaitingCheckout
                ? "Orden creada — falta abrir el pago"
                : "Pago en proceso"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          Orden {order.id.slice(0, 8)}… · {statusLabel}
          {isPolling && !isPaid && !isFailed && checkoutUrl && (
            <span className="inline-flex items-center ml-2">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          )}
        </p>
        {!isPaid && !isFailed && awaitingCheckout && (
          <p className="text-xs text-muted-foreground mt-1">
            No pudimos abrir el formulario de pago. Cierra este aviso e intenta
            comprar de nuevo en unos minutos. Si el problema continúa, contacta a
            soporte de Kynoo.
          </p>
        )}
        {!isPaid && !isFailed && checkoutUrl && (
          <p className="text-xs text-muted-foreground mt-1">
            Usa «Continuar pago» para completar el proceso aquí. Tu saldo se
            actualizará en cuanto se confirme el pago.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {checkoutUrl && !isPaid && !isFailed && onOpenCheckout && (
          <Button size="sm" onClick={onOpenCheckout}>
            <CreditCard className="h-4 w-4 mr-1" />
            Continuar pago
          </Button>
        )}
        {!isPaid && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-4 w-4 mr-1" />
            Cerrar
          </Button>
        )}
        {(isPaid || isFailed) && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}