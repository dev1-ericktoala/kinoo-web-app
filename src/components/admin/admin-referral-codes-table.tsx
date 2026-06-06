"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, Copy, Loader2, Pencil, Plus, Search } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { ApiError } from "@/lib/api-client"
import {
  ADMIN_FILTER_INPUT_CLASS,
  ADMIN_FILTER_LABEL_CLASS,
  ADMIN_FILTER_PANEL_CLASS,
  ADMIN_FILTER_SELECT_CLASS,
} from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  AdminCreateReferralCodeRequest,
  AdminReferralCode,
  AdminUpdateReferralCodeRequest,
} from "@/types"

type ActiveFilter = "all" | "active" | "inactive"

interface AdminReferralCodesTableProps {
  codes: AdminReferralCode[]
  onCodesChange: (codes: AdminReferralCode[]) => void
}

function CopyCodeButton({ code }: { code: string }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({ title: "Código copiado" })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el código.",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
      aria-label="Copiar código"
      title="Copiar código"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

export function AdminReferralCodesTable({
  codes,
  onCodesChange,
}: AdminReferralCodesTableProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminReferralCode | null>(null)
  const [saving, setSaving] = useState(false)

  const [formCode, setFormCode] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formMaxUses, setFormMaxUses] = useState("")
  const [formExpiresAt, setFormExpiresAt] = useState("")
  const [formActive, setFormActive] = useState(true)

  const filtered = useMemo(() => {
    let result = codes
    if (activeFilter === "active") {
      result = result.filter((c) => c.is_active)
    } else if (activeFilter === "inactive") {
      result = result.filter((c) => !c.is_active)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q),
      )
    }
    return result
  }, [codes, activeFilter, search])

  function resetForm() {
    setFormCode("")
    setFormTitle("")
    setFormDescription("")
    setFormMaxUses("")
    setFormExpiresAt("")
    setFormActive(true)
  }

  function openCreate() {
    resetForm()
    setCreateOpen(true)
  }

  function openEdit(code: AdminReferralCode) {
    setFormTitle(code.title)
    setFormDescription(code.description || "")
    setFormMaxUses(code.max_uses != null ? String(code.max_uses) : "")
    setFormExpiresAt(
      code.expires_at
        ? format(new Date(code.expires_at), "yyyy-MM-dd'T'HH:mm")
        : "",
    )
    setFormActive(code.is_active)
    setEditTarget(code)
  }

  function parseOptionalInt(value: string): number | undefined {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const n = Number.parseInt(trimmed, 10)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

  async function handleCreate() {
    const payload: AdminCreateReferralCodeRequest = {
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      max_uses: parseOptionalInt(formMaxUses),
      expires_at: formExpiresAt
        ? new Date(formExpiresAt).toISOString()
        : undefined,
    }

    if (!payload.code || !payload.title) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Código y título son obligatorios.",
      })
      return
    }

    setSaving(true)
    try {
      const created = await adminApi.referralCodes.create(payload)
      onCodesChange([created, ...codes])
      toast({ title: "Código creado", description: created.code })
      setCreateOpen(false)
      resetForm()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError ? err.message : "No se pudo crear el código.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!editTarget) return

    const maxUses = formMaxUses.trim()
      ? parseOptionalInt(formMaxUses)
      : null

    const payload: AdminUpdateReferralCodeRequest = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      is_active: formActive,
      max_uses: maxUses,
      expires_at: formExpiresAt
        ? new Date(formExpiresAt).toISOString()
        : null,
    }

    if (!payload.title) {
      toast({
        variant: "destructive",
        title: "Título requerido",
      })
      return
    }

    setSaving(true)
    try {
      const updated = await adminApi.referralCodes.update(editTarget.id, payload)
      onCodesChange(codes.map((c) => (c.id === updated.id ? updated : c)))
      toast({
        title: updated.is_active ? "Código actualizado" : "Código desactivado",
      })
      setEditTarget(null)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError
            ? err.message
            : "No se pudo actualizar el código.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className={ADMIN_FILTER_PANEL_CLASS}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 max-w-md space-y-1">
            <label className={ADMIN_FILTER_LABEL_CLASS}>Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Código, título o descripción…"
                className={cn(ADMIN_FILTER_INPUT_CLASS, "pl-9 pr-3")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={ADMIN_FILTER_LABEL_CLASS} htmlFor="ref-active-filter">
              Estado
            </label>
            <select
              id="ref-active-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
              className={ADMIN_FILTER_SELECT_CLASS}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <Button type="button" onClick={openCreate} className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Nuevo código
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          {codes.length === 0
            ? "Aún no hay códigos de campaña. Crea uno para empezar."
            : "No hay códigos que coincidan con los filtros."}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-xs font-medium">Código</TableHead>
                <TableHead className="text-xs font-medium">Título</TableHead>
                <TableHead className="text-xs font-medium">Descripción</TableHead>
                <TableHead className="text-xs font-medium text-center">
                  Usos
                </TableHead>
                <TableHead className="text-xs font-medium">Estado</TableHead>
                <TableHead className="text-xs font-medium">Expira</TableHead>
                <TableHead className="text-xs font-medium text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-sm font-medium">
                        {item.code}
                      </span>
                      <CopyCodeButton code={item.code} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium max-w-[160px]">
                    <span className="truncate block" title={item.title}>
                      {item.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-[220px]">
                    <span
                      className="line-clamp-2"
                      title={item.description || undefined}
                    >
                      {item.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-sm">
                    {item.usage_count}
                    {item.max_uses != null ? (
                      <span className="text-gray-400"> / {item.max_uses}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }
                    >
                      {item.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {item.expires_at
                      ? format(new Date(item.expires_at), "dd MMM yyyy", {
                          locale: es,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo código de referido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-code">Código</Label>
              <input
                id="create-code"
                value={formCode}
                onChange={(e) =>
                  setFormCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="PRONACA2026"
                maxLength={32}
                className={ADMIN_FILTER_INPUT_CLASS}
              />
              <p className="text-xs text-gray-500">
                4–32 caracteres, letras y números (A-Z, 0-9).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-title">Título</Label>
              <input
                id="create-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Campaña Pronaca 2026"
                className={ADMIN_FILTER_INPUT_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-desc">Descripción</Label>
              <Textarea
                id="create-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Para qué sirve este código, notas internas…"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-max">Límite de usos (opcional)</Label>
                <input
                  id="create-max"
                  type="number"
                  min={1}
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  placeholder="Ilimitado"
                  className={ADMIN_FILTER_INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-exp">Expira (opcional)</Label>
                <input
                  id="create-exp"
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className={ADMIN_FILTER_INPUT_CLASS}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreate()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Crear código"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar código</DialogTitle>
          </DialogHeader>
          {editTarget ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Código (no editable)</p>
                <p className="font-mono text-sm font-semibold">{editTarget.code}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {editTarget.usage_count} uso(s) registrados
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Título</Label>
                <input
                  id="edit-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={ADMIN_FILTER_INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Descripción</Label>
                <Textarea
                  id="edit-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-max">Límite de usos</Label>
                  <input
                    id="edit-max"
                    type="number"
                    min={1}
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    className={ADMIN_FILTER_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-exp">Expira</Label>
                  <input
                    id="edit-exp"
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className={ADMIN_FILTER_INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Código activo</p>
                  <p className="text-xs text-gray-500">
                    Desactivar impide nuevos registros con este código.
                  </p>
                </div>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleUpdate()} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
