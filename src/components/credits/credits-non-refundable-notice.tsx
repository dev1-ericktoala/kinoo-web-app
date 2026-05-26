import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/** Texto base compartido (legal / transparencia antes del gasto). */
export const CREDITS_NON_REFUNDABLE_SHORT =
  "Los créditos utilizados en ubicaciones de promociones no son reembolsables."

export const CREDITS_NON_REFUNDABLE_DETAIL =
  "Al confirmar una ubicación, el descuento es definitivo: no se devuelven créditos si eliminas el pin, si tu promoción es rechazada en revisión o si dejas de publicar. Las compras de paquetes de créditos siguen su propia política de reembolso (gestión administrativa)."

type NoticeVariant = "credits-page" | "location-spend" | "location-remove"

interface CreditsNonRefundableNoticeProps {
  variant?: NoticeVariant
  className?: string
  /** Créditos ya cobrados por la ubicación (modal de eliminación). */
  creditsCharged?: number | null
}

export function CreditsNonRefundableNotice({
  variant = "location-spend",
  className,
  creditsCharged,
}: CreditsNonRefundableNoticeProps) {
  if (variant === "credits-page") {
    return (
      <div
        role="note"
        className={cn(
          "rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950",
          className,
        )}
      >
        <div className="flex gap-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-amber-600 mt-0.5"
            aria-hidden
          />
          <div className="space-y-1.5">
            <p className="font-semibold text-amber-900">
              Política de créditos no reembolsables (uso en ubicaciones)
            </p>
            <p className="text-amber-900/90 leading-relaxed">
              {CREDITS_NON_REFUNDABLE_SHORT}{" "}
              {CREDITS_NON_REFUNDABLE_DETAIL}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "location-remove") {
    return (
      <p className={cn("text-sm text-muted-foreground leading-relaxed", className)}>
        {creditsCharged != null && creditsCharged > 0 ? (
          <>
            Se descontaron{" "}
            <strong className="text-foreground">{creditsCharged} créditos</strong>{" "}
            por esta ubicación.{" "}
          </>
        ) : null}
        {CREDITS_NON_REFUNDABLE_SHORT} Si la eliminas, esos créditos{" "}
        <strong className="text-foreground">no</strong> se acreditarán de nuevo a
        tu saldo.
      </p>
    )
  }

  // location-spend — antes de agregar / gastar
  return (
    <div
      role="note"
      className={cn(
        "flex gap-2.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950",
        className,
      )}
    >
      <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" aria-hidden />
      <p className="leading-relaxed">
        <span className="font-semibold text-amber-900">Aviso importante: </span>
        {CREDITS_NON_REFUNDABLE_SHORT} El cargo se aplica al confirmar cada
        ubicación y no es reversible.
      </p>
    </div>
  )
}
