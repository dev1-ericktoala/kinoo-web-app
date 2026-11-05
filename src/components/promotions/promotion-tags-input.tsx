"use client"

import { useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const PROMOTION_TAG_MAX = 8
export const PROMOTION_TAG_MIN_LEN = 2
export const PROMOTION_TAG_MAX_LEN = 40

/** Sugerencias guiadas (se pueden combinar con tags libres). */
export const PROMOTION_TAG_SUGGESTIONS = [
  "baño",
  "peluquería",
  "alimento",
  "comida húmeda",
  "juguetes",
  "cama",
  "snack",
  "veterinaria",
  "paseo",
  "cuidado",
  "descuento",
  "entrenamiento",
] as const

export function normalizePromotionTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().replace(/\s+/g, " ")
  if (!tag) return null
  if (tag.length < PROMOTION_TAG_MIN_LEN || tag.length > PROMOTION_TAG_MAX_LEN) {
    return null
  }
  return tag
}

interface PromotionTagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  error?: string
  disabled?: boolean
}

export function PromotionTagsInput({
  value,
  onChange,
  error,
  disabled,
}: PromotionTagsInputProps) {
  const [draft, setDraft] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const tags = value ?? []
  const atLimit = tags.length >= PROMOTION_TAG_MAX

  function addTag(raw: string) {
    const tag = normalizePromotionTag(raw)
    if (!tag) {
      setLocalError(
        `Cada etiqueta debe tener entre ${PROMOTION_TAG_MIN_LEN} y ${PROMOTION_TAG_MAX_LEN} caracteres`,
      )
      return
    }
    if (tags.includes(tag)) {
      setLocalError("Esa etiqueta ya está agregada")
      setDraft("")
      return
    }
    if (atLimit) {
      setLocalError(`Máximo ${PROMOTION_TAG_MAX} etiquetas`)
      return
    }
    setLocalError(null)
    setDraft("")
    onChange([...tags, tag])
  }

  function removeTag(tag: string) {
    setLocalError(null)
    onChange(tags.filter((t) => t !== tag))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (draft.trim()) addTag(draft)
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const suggestions = PROMOTION_TAG_SUGGESTIONS.filter((s) => !tags.includes(s))

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="promotion-tags" className="text-xs font-medium">
          Etiquetas *
        </Label>
        <p className="text-xs text-muted-foreground">
          Kynoo puede recomendar tu publicación en el chat. Usa un título
          concreto, una descripción breve y al menos una etiqueta (ej. baño,
          alimento, cama). Sin etiquetas claras, es difícil sugerirte.
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pl-2 pr-1 font-normal"
            >
              {tag}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeTag(tag)}
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Quitar ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          id="promotion-tags"
          value={draft}
          disabled={disabled || atLimit}
          placeholder={
            atLimit
              ? `Máximo ${PROMOTION_TAG_MAX} etiquetas`
              : "Escribe y Enter (o coma)"
          }
          className="h-9"
          onChange={(e) => {
            setDraft(e.target.value)
            if (localError) setLocalError(null)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addTag(draft)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          disabled={disabled || atLimit || !draft.trim()}
          onClick={() => addTag(draft)}
        >
          Agregar
        </Button>
      </div>

      {suggestions.length > 0 && !atLimit && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => addTag(s)}
              className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {tags.length}/{PROMOTION_TAG_MAX} · mín. 1 obligatoria
      </p>

      {(localError || error) && (
        <p className="text-xs text-destructive">{localError || error}</p>
      )}
    </div>
  )
}
