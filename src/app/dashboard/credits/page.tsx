"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "@/lib/api-client"
import { useProviderCredits } from "@/hooks/use-provider-credits"
import { useToast } from "@/hooks/use-toast"
import {
  PENDING_CREDIT_CHECKOUT_URL_KEY,
  PENDING_CREDIT_ORDER_KEY,
} from "@/lib/constants"
import { CreditBalanceCard } from "@/components/credits/credit-balance-card"
import { CreditsNonRefundableNotice } from "@/components/credits/credits-non-refundable-notice"
import { CreditPacksGrid } from "@/components/credits/credit-packs-grid"
import { CreditTransactionsTable } from "@/components/credits/credit-transactions-table"
import { NuveiCheckoutModal } from "@/components/credits/nuvei-checkout-modal"
import { PendingPaymentBanner } from "@/components/credits/pending-payment-banner"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  CreditPack,
  ProviderCreditOrder,
  ProviderCreditLedgerEntry,
} from "@/types"

const POLL_INTERVAL_MS = 4000
const MAX_POLL_ATTEMPTS = 45

function isPendingStatus(status: string) {
  return status === "pending" || status === "processing"
}

function resolveCheckoutUrl(
  order: ProviderCreditOrder | null,
  storedUrl: string | null,
): string | null {
  if (storedUrl) return storedUrl
  if (order?.checkout_url) return order.checkout_url
  return null
}

function shouldPollOrder(order: ProviderCreditOrder, checkoutUrl: string | null) {
  if (!isPendingStatus(order.status)) return false
  return Boolean(checkoutUrl) || order.status === "processing"
}

export default function CreditsPage() {
  const { toast } = useToast()
  const { balance, refreshBalance } = useProviderCredits()
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [transactions, setTransactions] = useState<ProviderCreditLedgerEntry[]>(
    [],
  )
  const [pendingOrder, setPendingOrder] = useState<ProviderCreditOrder | null>(
    null,
  )
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const pollAttempts = useRef(0)

  const refreshData = useCallback(async () => {
    const [, txRes] = await Promise.all([
      refreshBalance(),
      api.credits.transactions(30, 0),
    ])
    setTransactions(txRes.items)
  }, [refreshBalance])

  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    try {
      const [packsRes, txRes] = await Promise.all([
        api.credits.packs(),
        api.credits.transactions(30, 0),
      ])
      setPacks(packsRes.packs)
      setTransactions(txRes.items)

      const storedOrderId =
        typeof window !== "undefined"
          ? sessionStorage.getItem(PENDING_CREDIT_ORDER_KEY)
          : null
      const storedCheckoutUrl =
        typeof window !== "undefined"
          ? sessionStorage.getItem(PENDING_CREDIT_CHECKOUT_URL_KEY)
          : null
      if (storedCheckoutUrl) {
        setPendingCheckoutUrl(storedCheckoutUrl)
      }

      if (storedOrderId) {
        try {
          const order = await api.credits.getOrder(storedOrderId)
          setPendingOrder(order)
          const url = resolveCheckoutUrl(order, storedCheckoutUrl)
          if (url) {
            setPendingCheckoutUrl(url)
            sessionStorage.setItem(PENDING_CREDIT_CHECKOUT_URL_KEY, url)
          }
        } catch {
          sessionStorage.removeItem(PENDING_CREDIT_ORDER_KEY)
          sessionStorage.removeItem(PENDING_CREDIT_CHECKOUT_URL_KEY)
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la información de créditos.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const clearPendingOrder = useCallback(() => {
    sessionStorage.removeItem(PENDING_CREDIT_ORDER_KEY)
    sessionStorage.removeItem(PENDING_CREDIT_CHECKOUT_URL_KEY)
    setPendingOrder(null)
    setPendingCheckoutUrl(null)
    pollAttempts.current = 0
    setIsPolling(false)
  }, [])

  const handleOpenCheckout = useCallback(() => {
    if (!pendingCheckoutUrl) return
    setIsCheckoutOpen(true)
  }, [pendingCheckoutUrl])

  useEffect(() => {
    if (!pendingOrder || !shouldPollOrder(pendingOrder, pendingCheckoutUrl)) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)
    pollAttempts.current = 0

    const orderId = pendingOrder.id

    const syncOrderStatus = async () => {
      pollAttempts.current += 1
      try {
        const order = await api.credits.getOrder(orderId)
        setPendingOrder(order)
        const url = resolveCheckoutUrl(order, pendingCheckoutUrl)
        if (url && url !== pendingCheckoutUrl) {
          setPendingCheckoutUrl(url)
          sessionStorage.setItem(PENDING_CREDIT_CHECKOUT_URL_KEY, url)
        }

        if (order.status === "paid") {
          setIsCheckoutOpen(false)
          await refreshData()
          toast({
            title: "Créditos acreditados",
            description: "Tu pago fue confirmado correctamente.",
          })
          clearPendingOrder()
        } else if (
          order.status === "failed" ||
          order.status === "expired" ||
          order.status === "refunded"
        ) {
          clearPendingOrder()
        } else if (pollAttempts.current >= MAX_POLL_ATTEMPTS) {
          setIsPolling(false)
          toast({
            variant: "destructive",
            title: "Pago pendiente",
            description:
              "Aún no recibimos confirmación. Si pagaste, espera unos minutos o contacta soporte.",
          })
        }
      } catch {
        /* ignorar errores transitorios de red */
      }
    }

    const onReturnToTab = () => {
      void syncOrderStatus()
    }

    window.addEventListener("focus", onReturnToTab)
    document.addEventListener("visibilitychange", onReturnToTab)

    const interval = setInterval(() => {
      void syncOrderStatus()
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onReturnToTab)
      document.removeEventListener("visibilitychange", onReturnToTab)
    }
  }, [pendingOrder, pendingCheckoutUrl, refreshData, toast, clearPendingOrder])

  async function handlePurchase(packId: string) {
    setPurchasingPackId(packId)
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${packId}`

      const res = await api.credits.createOrder(packId, idempotencyKey)
      const checkoutUrl = res.checkout_url ?? null

      setPendingOrder(res.order)
      sessionStorage.setItem(PENDING_CREDIT_ORDER_KEY, res.order.id)

      if (checkoutUrl) {
        setPendingCheckoutUrl(checkoutUrl)
        sessionStorage.setItem(PENDING_CREDIT_CHECKOUT_URL_KEY, checkoutUrl)
        setIsCheckoutOpen(true)
      } else {
        setPendingCheckoutUrl(null)
        sessionStorage.removeItem(PENDING_CREDIT_CHECKOUT_URL_KEY)
        toast({
          title: "Orden creada",
          description: res.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo crear la orden."
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    } finally {
      setPurchasingPackId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[100px] rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[240px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <NuveiCheckoutModal
        open={isCheckoutOpen && Boolean(pendingCheckoutUrl)}
        checkoutUrl={pendingCheckoutUrl}
        onOpenChange={setIsCheckoutOpen}
      />

      {pendingOrder && (
        <PendingPaymentBanner
          order={pendingOrder}
          checkoutUrl={pendingCheckoutUrl}
          isPolling={isPolling}
          onDismiss={clearPendingOrder}
          onOpenCheckout={pendingCheckoutUrl ? handleOpenCheckout : undefined}
        />
      )}

      <CreditBalanceCard balance={balance ?? 0} />

      <CreditsNonRefundableNotice variant="credits-page" />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Comprar créditos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            1 crédito = 1 USD. Los créditos se usan para publicidad en Kynoo
            (por ejemplo, al agregar ubicaciones en tus promociones).
          </p>
        </div>
        <CreditPacksGrid
          packs={packs}
          purchasingPackId={purchasingPackId}
          onPurchase={handlePurchase}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Historial</h2>
        <CreditTransactionsTable items={transactions} />
      </section>
    </div>
  )
}
