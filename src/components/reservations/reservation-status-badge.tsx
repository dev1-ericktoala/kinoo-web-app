import { Badge } from "@/components/ui/badge"
import { PROMOTION_PAID_ORDER_STATUS_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { PromotionPaidOrderStatus } from "@/types"

const statusConfig: Record<
  PromotionPaidOrderStatus,
  { label: string; className: string }
> = {
  paid: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.paid,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.pending,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  processing: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.processing,
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  failed: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.failed,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  expired: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.expired,
    className: "bg-zinc-50 text-zinc-500 border-zinc-200",
  },
  cancelled: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.cancelled,
    className: "bg-zinc-50 text-zinc-500 border-zinc-200",
  },
  refunded: {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS.refunded,
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
}

interface ReservationStatusBadgeProps {
  status: PromotionPaidOrderStatus
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: PROMOTION_PAID_ORDER_STATUS_LABELS[status] || status,
    className: "bg-zinc-50 text-zinc-500 border-zinc-200",
  }

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-normal", config.className)}
    >
      {config.label}
    </Badge>
  )
}
