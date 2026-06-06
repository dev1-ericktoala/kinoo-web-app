"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Promotion } from "@/types"

interface AdminSuspensionToggleProps {
  promotion: Promotion
  onUpdated: (updated: Promotion) => void
}

export function AdminSuspensionToggle({
  promotion,
  onUpdated,
}: AdminSuspensionToggleProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")

  const isEnabled = !promotion.admin_suspended

  async function applySuspension(suspended: boolean, suspensionReason?: string) {
    setLoading(true)
    try {
      const updated = await adminApi.publications.setAdminSuspension(
        promotion.id,
        {
          suspended,
          reason: suspensionReason?.trim() || null,
        },
      )
      onUpdated(updated)
      toast({
        title: suspended ? "Publicación suspendida" : "Suspensión levantada",
        description: suspended
          ? "El proveedor no podrá reactivarla hasta que la habilites."
          : "El proveedor puede volver a activarla desde su panel.",
      })
      setDialogOpen(false)
      setReason("")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError
            ? err.message
            : "No se pudo actualizar la suspensión.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleToggle(checked: boolean) {
    if (checked) {
      void applySuspension(false)
      return
    }
    setDialogOpen(true)
  }

  return (
    <>
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={loading}
        aria-label={
          isEnabled
            ? "Publicación habilitada por admin"
            : "Publicación suspendida por admin"
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspender publicación</DialogTitle>
            <DialogDescription>
              Se desactivará para usuarios y el proveedor no podrá reactivarla
              hasta que la habilites de nuevo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason" className="text-xs">
              Motivo (opcional, visible para el proveedor)
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej.: incumplimiento de políticas de contenido"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={() => void applySuspension(true, reason)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
