"use client"

import { useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const NUVEI_CHECKOUT_HOSTS = new Set([
  "ccapi-stg.paymentez.com",
  "ccapi.paymentez.com",
])

const NUVEI_CHECK_ORIGINS = [
  "https://ccapi-stg.paymentez.com",
  "https://ccapi.paymentez.com",
]

const IFRAME_ID = "nuvei-checkout-iframe"

type IFrameResizerInstance = { close: () => void }

type IFrameResizeFn = (
  options: Record<string, unknown>,
  target: string,
) => IFrameResizerInstance[] | void

function isNuveiOrigin(origin: string): boolean {
  try {
    return NUVEI_CHECKOUT_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

function isPaymentSuccessMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") return false
  const tx = (message as { transaction?: { status?: unknown; status_detail?: unknown } })
    .transaction
  if (!tx) return false

  const status = String(tx.status ?? "").toLowerCase()
  const detail = String(tx.status_detail ?? "")

  const approved =
    status === "success" || status === "1" || status === "approved"
  return approved && (detail === "3" || detail === "0" || detail === "")
}

function handleNuveiMessage(message: unknown, onClose: () => void) {
  if (message === "close-payment-popup") {
    onClose()
    return
  }
  if (isPaymentSuccessMessage(message)) {
    onClose()
  }
}

interface NuveiCheckoutModalProps {
  open: boolean
  checkoutUrl: string | null
  onOpenChange: (open: boolean) => void
}

/**
 * Checkout Nuvei en iframe (patrón Paymentez / iframe-resizer).
 * El hijo llama parentIFrame.sendMessage(); el padre usa iFrameResize + onMessage.
 * La acreditación de créditos sigue siendo solo vía webhook en el backend.
 */
export function NuveiCheckoutModal({
  open,
  checkoutUrl,
  onOpenChange,
}: NuveiCheckoutModalProps) {
  const resizerRef = useRef<IFrameResizerInstance[]>([])

  useEffect(() => {
    if (!open || !checkoutUrl) return

    let cancelled = false

    const onClose = () => onOpenChange(false)

    function onPostMessage(event: MessageEvent) {
      if (!isNuveiOrigin(event.origin)) return
      handleNuveiMessage(event.data, onClose)
    }

    window.addEventListener("message", onPostMessage)

    const timer = window.setTimeout(() => {
      void import("iframe-resizer/js/iframeResizer").then(() => {
        if (cancelled) return

        const iFrameResize = (
          window as Window & { iFrameResize?: IFrameResizeFn }
        ).iFrameResize
        if (!iFrameResize) return

        const instances = iFrameResize(
          {
            log: false,
            checkOrigin: NUVEI_CHECK_ORIGINS,
            heightCalculationMethod: "bodyScroll",
            onMessage: ({ message }: { message: unknown }) => {
              handleNuveiMessage(message, onClose)
            },
          },
          `#${IFRAME_ID}`,
        )

        if (Array.isArray(instances)) {
          resizerRef.current = instances
        }
      })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener("message", onPostMessage)
      resizerRef.current.forEach((instance) => {
        try {
          instance.close()
        } catch {
          /* noop */
        }
      })
      resizerRef.current = []
    }
  }, [open, checkoutUrl, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 overflow-hidden sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Pago con tarjeta</DialogTitle>
          <DialogDescription>
            Pago con tarjeta de forma segura. Cuando se confirme, verás los
            créditos en tu cuenta en unos segundos.
          </DialogDescription>
        </DialogHeader>
        {checkoutUrl ? (
          <iframe
            id={IFRAME_ID}
            title="Formulario de pago"
            src={checkoutUrl}
            className="w-full min-h-[520px] h-[75vh] max-h-[720px] border-0 bg-white"
            allow="payment *"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
