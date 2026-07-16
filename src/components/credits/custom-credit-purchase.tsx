"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Minus, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { CustomPurchaseSettings } from "@/types"

interface CustomCreditPurchaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: CustomPurchaseSettings
  isPurchasing: boolean
  onPurchase: (credits: number) => void
}

function formatMoney(value: number) {
  return value.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatCredits(value: number) {
  return value.toLocaleString("es-EC", {
    maximumFractionDigits: 0,
  })
}

function buildQuickAmounts(min: number, max: number): number[] {
  const candidates = [min, 15, 30, 40, 75, 150, 250, 500]
    .filter((n) => n >= min && n <= max)
  const unique = Array.from(new Set(candidates))
  return unique.slice(0, 6)
}

export function CustomCreditPurchaseModal({
  open,
  onOpenChange,
  settings,
  isPurchasing,
  onPurchase,
}: CustomCreditPurchaseModalProps) {
  const minCredits = Number(settings.min_credits)
  const maxCredits = Number(settings.max_credits)
  const rate = Number(settings.credits_per_usd) || 1
  const quickAmounts = useMemo(
    () => buildQuickAmounts(minCredits, maxCredits),
    [minCredits, maxCredits],
  )

  const [rawValue, setRawValue] = useState(String(minCredits))

  useEffect(() => {
    if (open) {
      setRawValue(String(minCredits))
    }
  }, [open, minCredits])

  const credits = useMemo(() => {
    const n = Number(rawValue)
    if (!Number.isFinite(n) || rawValue.trim() === "") return null
    return Math.round(n)
  }, [rawValue])

  const amountUsd =
    credits != null && credits > 0 ? credits / rate : null

  const error = useMemo(() => {
    if (credits == null) return null
    if (credits <= 0) return "Ingresa una cantidad mayor a 0"
    if (credits < minCredits) return `El mínimo es ${minCredits} créditos`
    if (credits > maxCredits) return `El máximo es ${maxCredits} créditos`
    return null
  }, [credits, minCredits, maxCredits])

  const canSubmit =
    !isPurchasing &&
    credits != null &&
    error == null &&
    amountUsd != null &&
    amountUsd > 0

  function setCreditsClamped(next: number) {
    const clamped = Math.min(maxCredits, Math.max(minCredits, Math.round(next)))
    setRawValue(String(clamped))
  }

  function step(delta: number) {
    const base = credits ?? minCredits
    setCreditsClamped(base + delta)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPurchasing) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle>Cantidad personalizada</DialogTitle>
          </div>
          <DialogDescription>
            Elige exactamente cuántos créditos necesitas. 1 crédito = 1 USD.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cantidad de créditos
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={isPurchasing || (credits != null && credits <= minCredits)}
                onClick={() => step(-5)}
                aria-label="Restar 5 créditos"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                id="custom-credits-modal"
                type="number"
                inputMode="numeric"
                min={minCredits}
                max={maxCredits}
                step="1"
                value={rawValue}
                disabled={isPurchasing}
                onChange={(e) => setRawValue(e.target.value)}
                onBlur={() => {
                  if (credits == null) {
                    setRawValue(String(minCredits))
                    return
                  }
                  setCreditsClamped(credits)
                }}
                className="h-11 text-center text-2xl font-semibold tracking-tight [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={isPurchasing || (credits != null && credits >= maxCredits)}
                onClick={() => step(5)}
                aria-label="Sumar 5 créditos"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {error ? (
              <p className="text-xs text-destructive text-center">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Entre {formatCredits(minCredits)} y {formatCredits(maxCredits)}{" "}
                créditos
              </p>
            )}
          </div>

          {quickAmounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sugerencias rápidas
              </p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => {
                  const selected = credits === amount
                  return (
                    <button
                      key={amount}
                      type="button"
                      disabled={isPurchasing}
                      onClick={() => setCreditsClamped(amount)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-background text-foreground hover:bg-accent",
                      )}
                    >
                      {formatCredits(amount)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-muted/50 border border-border/50 px-4 py-4 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">Recibirás</span>
              <span className="text-base font-semibold text-foreground">
                {credits != null && !error
                  ? `${formatCredits(credits)} créditos`
                  : "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {amountUsd != null && !error ? formatMoney(amountUsd) : "—"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isPurchasing}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (credits == null || error) return
              onPurchase(credits)
            }}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              "Continuar al pago"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
