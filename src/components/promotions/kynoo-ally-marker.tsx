"use client"

import { HeartHandshake } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/** Icono compartido: listas, formulario y revisión admin. */
export function KynooAllyIcon({
  className,
}: {
  className?: string
}) {
  return <HeartHandshake className={cn("h-3.5 w-3.5", className)} />
}

/**
 * Marcador compacto para tablas (admin / proveedor).
 * Icono con tooltip; mismo símbolo que el switch del formulario.
 */
export function KynooAllyListMarker({
  className,
}: {
  className?: string
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#4a6b1e]/30 bg-[#4a6b1e]/10 text-[#4a6b1e]",
              className,
            )}
            aria-label="Aliado Kynoo Pet Care"
          >
            <KynooAllyIcon />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">
          <p className="font-medium">Aliado Kynoo Pet Care</p>
          <p className="text-muted-foreground mt-0.5">
            Beneficio marcado para verificación con el equipo de Kynoo.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
