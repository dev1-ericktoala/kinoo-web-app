"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ActiveToggleProps {
  promotionId: string
  isActive: boolean
  adminSuspended?: boolean
  onToggled: (newValue: boolean) => void
}

export function ActiveToggle({
  promotionId,
  isActive,
  adminSuspended = false,
  onToggled,
}: ActiveToggleProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleToggle() {
    if (adminSuspended) {
      toast({
        variant: "destructive",
        title: "Publicación suspendida",
        description:
          "Esta publicación fue suspendida por administración KYNOO. Contacta al equipo si necesitas ayuda.",
      })
      return
    }

    const newValue = !isActive
    setLoading(true)

    try {
      await api.promotions.patch(promotionId, {
        is_active: newValue,
        deactivated_at: newValue ? null : new Date().toISOString(),
      })
      onToggled(newValue)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError
            ? err.message
            : "No se pudo cambiar el estado.",
      })
    } finally {
      setLoading(false)
    }
  }

  const switchControl = (
    <Switch
      checked={isActive}
      onCheckedChange={handleToggle}
      disabled={loading || adminSuspended}
      className="data-[state=checked]:bg-[#4a6b1e]"
    />
  )

  if (!adminSuspended) {
    return switchControl
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{switchControl}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">
          Suspendida por administración KYNOO. No puedes reactivarla desde aquí.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
