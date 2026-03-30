import { HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { PromotionStatus } from "@/types"

const FALLBACK_REJECTION_REASON =
  "Tu anuncio no cumple con nuestras políticas de promociones y servicios. Por favor revísalo y vuelve a intentar más tarde."

const statusConfig: Record<
  PromotionStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className: "bg-[#eef2e6] text-[#3d5a1e] border-[#c7d4ab]",
  },
  inactive: {
    label: "Inactiva",
    className: "bg-zinc-50 text-zinc-400 border-zinc-200",
  },
  pending_review: {
    label: "En revisión",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label: "Rechazada",
    className: "bg-red-50 text-red-700 border-red-200",
  },
}

interface StatusBadgeProps {
  status: PromotionStatus
  isActive: boolean
  reason?: string | null
}

export function StatusBadge({ status, isActive, reason }: StatusBadgeProps) {
  // Rejection takes priority: show "Rechazada" even when is_active=false
  const effectiveStatus: PromotionStatus =
    status === "rejected" ? "rejected" : !isActive ? "inactive" : status

  const config = statusConfig[effectiveStatus] ?? statusConfig.inactive
  const isRejected = effectiveStatus === "rejected"
  const tooltipText = reason?.trim() || FALLBACK_REJECTION_REASON

  return (
    <span className="inline-flex items-center gap-1">
      <Badge
        variant="outline"
        className={cn("text-xs font-normal", config.className)}
      >
        {config.label}
      </Badge>

      {isRejected && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                className="h-3.5 w-3.5 text-red-400 cursor-help shrink-0"
                aria-label="Ver motivo del rechazo"
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[280px] whitespace-normal leading-relaxed text-left"
            >
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  )
}
