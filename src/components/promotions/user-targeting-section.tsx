"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Users } from "lucide-react"
import {
  USER_GENDER_VALUES,
  USER_PET_MEANING_VALUES,
  type UserFilters,
  type UserGender,
  type UserPetMeaning,
} from "@/types"

// ─── UI labels (label visible → API value) ──────────────

const GENDER_OPTIONS: ReadonlyArray<{ label: string; value: UserGender }> = [
  { label: "Femenino", value: "female" },
  { label: "Masculino", value: "male" },
  { label: "Otro", value: "other" },
  { label: "Prefiero no decir", value: "prefer_not_say" },
]

const PET_MEANING_OPTIONS: ReadonlyArray<{
  label: string
  value: UserPetMeaning
}> = [
  { label: "Adopción", value: "adopcion" },
  { label: "Rescatista", value: "rescatista" },
  { label: "Mis hijos", value: "mis_hijos" },
  { label: "Parte de mi familia", value: "parte_de_mi_familia" },
  { label: "Compañía", value: "compania" },
  { label: "Solo mis mascotas", value: "solo_mis_mascotas" },
  { label: "Compañero de trabajo", value: "companero_de_trabajo" },
  { label: "Terapia", value: "terapia" },
]

// ─── Props ──────────────────────────────────────────────

interface UserTargetingSectionProps {
  value: UserFilters
  onChange: (filters: UserFilters) => void
}

// ─── Component ──────────────────────────────────────────

export function UserTargetingSection({
  value,
  onChange,
}: UserTargetingSectionProps) {
  const [isOpen, setIsOpen] = useState(() => Object.keys(value).length > 0)

  const filterCount = Object.keys(value).length

  function toggleArrayValue(
    key: "genders" | "pet_meanings",
    optionValue: string,
    checked: boolean,
  ) {
    const current = value[key] || []
    const next = checked
      ? Array.from(new Set([...current, optionValue]))
      : current.filter((v) => v !== optionValue)

    const merged: UserFilters = { ...value }
    if (next.length > 0) {
      merged[key] = next
    } else {
      delete merged[key]
    }
    onChange(merged)
  }

  return (
    <Card className="border-border/60">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Segmentación por usuario
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filtra qué personas verán esta publicación
                  </CardDescription>
                </div>
                {filterCount > 0 && !isOpen && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filterCount} filtro{filterCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* ── Gender ── */}
            <div>
              <Label className="text-xs font-medium">Género del usuario</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Si no marcas ninguno, se mostrará a usuarios de cualquier
                género.
              </p>
              <div className="flex flex-wrap gap-4">
                {GENDER_OPTIONS.map((opt) => {
                  const checked = (value.genders || []).includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          toggleArrayValue("genders", opt.value, !!v)
                        }
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* ── Pet meanings ── */}
            <div>
              <Label className="text-xs font-medium">
                Significado de las mascotas
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Cómo describe el usuario su relación con sus mascotas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {PET_MEANING_OPTIONS.map((opt) => {
                  const checked = (value.pet_meanings || []).includes(
                    opt.value,
                  )
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          toggleArrayValue("pet_meanings", opt.value, !!v)
                        }
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// ─── Sanitization ───────────────────────────────────────

/**
 * Filter the input to only contain values allowed by the backend.
 * Drops empty arrays so the resulting object only carries active filters.
 * Prevents the backend from returning 422 if anything stale gets in.
 */
export function sanitizeUserFilters(input: UserFilters): UserFilters {
  const out: UserFilters = {}

  const genders = (input.genders || []).filter((g): g is UserGender =>
    (USER_GENDER_VALUES as readonly string[]).includes(g),
  )
  if (genders.length > 0) out.genders = genders

  const meanings = (input.pet_meanings || []).filter((m): m is UserPetMeaning =>
    (USER_PET_MEANING_VALUES as readonly string[]).includes(m),
  )
  if (meanings.length > 0) out.pet_meanings = meanings

  return out
}
