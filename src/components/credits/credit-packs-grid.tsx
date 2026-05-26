"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CreditPack } from "@/types"

interface CreditPacksGridProps {
  packs: CreditPack[]
  purchasingPackId: string | null
  onPurchase: (packId: string) => void
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
  onPurchase,
}: CreditPacksGridProps) {
  if (packs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay paquetes disponibles en este momento.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {packs.map((pack) => {
        const isLoading = purchasingPackId === pack.id
        return (
          <Card key={pack.id} className="border-border/60 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{pack.label}</CardTitle>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {Number(pack.credits)} créditos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatMoney(pack.amount_usd)}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!!purchasingPackId}
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
    </div>
  )
}
