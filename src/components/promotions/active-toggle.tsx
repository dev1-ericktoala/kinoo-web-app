"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ActiveToggleProps {
  promotionId: string
  isActive: boolean
  onToggled: (newValue: boolean) => void
}

export function ActiveToggle({
  promotionId,
  isActive,
  onToggled,
}: ActiveToggleProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleToggle() {
    const newValue = !isActive
    setLoading(true)

    try {
      await api.promotions.patch(promotionId, {
        is_active: newValue,
        deactivated_at: newValue ? null : new Date().toISOString(),
      })
      onToggled(newValue)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar el estado.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleToggle}
      disabled={loading}
      className="data-[state=checked]:bg-[#4a6b1e]"
    />
  )
}
