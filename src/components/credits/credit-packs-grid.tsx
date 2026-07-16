"use client"

import { Loader2, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CreditPack } from "@/types"

interface CreditPacksGridProps {
  packs: CreditPack[]
  purchasingPackId: string | null
  disabled?: boolean
  showCustomOption?: boolean
  onPurchase: (packId: string) => void
  onCustomClick?: () => void
}

function formatMoney(value: number | string) {
  const n = Number(value)
  return n.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  })
}

export function CreditPacksGrid({
  packs,
  purchasingPackId,
  disabled = false,
  showCustomOption = false,
  onPurchase,
  onCustomClick,
}: CreditPacksGridProps) {
  if (packs.length === 0 && !showCustomOption) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay paquetes disponibles en este momento.
      </p>
    )
  }

  const busy = disabled || !!purchasingPackId

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
      {packs.map((pack) => {
        const isLoading = purchasingPackId === pack.id
        return (
          <Card
            key={pack.id}
            className="border-border/60 flex flex-col transition-shadow hover:shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{pack.label}</CardTitle>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-1">
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {Number(pack.credits)}
              </p>
              <p className="text-sm text-muted-foreground">créditos</p>
              <p className="text-sm font-medium text-foreground pt-2">
                {formatMoney(pack.amount_usd)}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => onPurchase(pack.id)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando…
                  </>
                ) : (
                  "Comprar"
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}

      {showCustomOption && onCustomClick && (
        <Card
          className={cn(
            "border-dashed border-2 border-border/70 bg-muted/20 flex flex-col",
            "transition-colors hover:border-primary/40 hover:bg-muted/35",
          )}
        >
          <CardHeader className="pb-2">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border/60 text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg">Cantidad personalizada</CardTitle>
            <CardDescription>
              Elige exactamente los créditos que necesitas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Ideal si ningún paquete se ajusta a lo que buscas.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              disabled={busy}
              onClick={onCustomClick}
            >
              Elegir cantidad
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
