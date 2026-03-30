"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ChevronDown, PawPrint, X } from "lucide-react"
import type { Breed, PetFilters } from "@/types"

// ─── Constants (UI labels → API values) ─────────────────

const SPECIES_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Perro", value: "dog" },
  { label: "Gato", value: "cat" },
] as const

const SEX_OPTIONS = [
  { label: "Ambos", value: "" },
  { label: "Macho", value: "male" },
  { label: "Hembra", value: "female" },
] as const

const AGE_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Cachorro", value: "puppy" },
  { label: "Adulto", value: "adult" },
  { label: "Geriátrico", value: "senior" },
] as const

const HEALTH_OPTIONS = [
  { label: "Cualquiera", value: "" },
  { label: "Sano", value: "healthy" },
  { label: "Con alguna condición médica", value: "has_condition" },
] as const

const BOOL_OPTIONS = [
  { label: "Cualquiera", value: "" },
  { label: "Sí", value: "true" },
  { label: "No", value: "false" },
] as const

const WEIGHT_OPTIONS = [
  { label: "Desnutrido", value: "underweight" },
  { label: "Peso ideal", value: "ideal" },
  { label: "Sobrepeso", value: "overweight" },
] as const

// Species code → API param for breeds endpoint
const SPECIES_BREED_PARAM: Record<string, string> = {
  dog: "perro",
  cat: "gato",
}

// ─── Props ──────────────────────────────────────────────

interface PetTargetingSectionProps {
  value: PetFilters
  onChange: (filters: PetFilters) => void
}

// ─── Component ──────────────────────────────────────────

export function PetTargetingSection({
  value,
  onChange,
}: PetTargetingSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if there are existing filters
    return Object.keys(value).length > 0
  })
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [breedsLoading, setBreedsLoading] = useState(false)

  const selectedSpecies = value.species?.[0] || ""

  // Load breeds when species changes
  const loadBreeds = useCallback(async (species: string) => {
    const param = SPECIES_BREED_PARAM[species]
    if (!param) {
      setBreeds([])
      return
    }
    setBreedsLoading(true)
    try {
      const data = await api.pets.breeds(param)
      setBreeds(data)
    } catch {
      setBreeds([])
    } finally {
      setBreedsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSpecies) {
      loadBreeds(selectedSpecies)
    } else {
      setBreeds([])
    }
  }, [selectedSpecies, loadBreeds])

  // Helper to update a single key in filters
  function update(patch: Partial<PetFilters>) {
    onChange({ ...value, ...patch })
  }

  // Helper to remove a key entirely
  function remove(key: keyof PetFilters) {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  // Count active filters for the badge
  const filterCount = Object.keys(value).length

  // Get breed name by ID
  function getBreedName(breedId: string): string {
    return breeds.find((b) => b.id === breedId)?.name || breedId
  }

  return (
    <Card className="border-border/60">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Segmentación por mascota
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filtra qué mascotas verán esta publicación
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
            {/* ── Primary filters ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Species */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Especie</Label>
                <Select
                  value={selectedSpecies}
                  onValueChange={(v) => {
                    if (v) {
                      update({ species: [v] })
                    } else {
                      // "Todas" → remove species and breeds
                      const next = { ...value }
                      delete next.species
                      delete next.breeds
                      onChange(next)
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "_all"} value={opt.value || "_all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sex */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Sexo</Label>
                <Select
                  value={value.sex?.[0] || ""}
                  onValueChange={(v) => {
                    if (v && v !== "_all") {
                      update({ sex: [v] })
                    } else {
                      remove("sex")
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Ambos" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "_all"} value={opt.value || "_all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Edad</Label>
                <Select
                  value={value.age_categories?.[0] || ""}
                  onValueChange={(v) => {
                    if (v && v !== "_all") {
                      update({ age_categories: [v] })
                    } else {
                      remove("age_categories")
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || "_all"} value={opt.value || "_all"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Breeds (only if species selected) ── */}
            {selectedSpecies && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Razas</Label>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!v) return
                    const current = value.breeds || []
                    if (!current.includes(v)) {
                      update({ breeds: [...current, v] })
                    }
                  }}
                  disabled={breedsLoading || breeds.length === 0}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        breedsLoading
                          ? "Cargando razas..."
                          : breeds.length === 0
                            ? "Sin razas disponibles"
                            : "Agregar raza"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds
                      .filter((b) => !(value.breeds || []).includes(b.id))
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {(value.breeds || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {value.breeds!.map((breedId) => (
                      <Badge
                        key={breedId}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {getBreedName(breedId)}
                        <button
                          type="button"
                          onClick={() => {
                            const next = value.breeds!.filter(
                              (id) => id !== breedId,
                            )
                            if (next.length > 0) {
                              update({ breeds: next })
                            } else {
                              remove("breeds")
                            }
                          }}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* ── Health & Medical ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Salud y médico
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Health */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Salud</Label>
                  <Select
                    value={value.health || ""}
                    onValueChange={(v) => {
                      if (v && v !== "_all") {
                        update({ health: v })
                      } else {
                        remove("health")
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value || "_all"}
                          value={opt.value || "_all"}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vaccinated */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Vacunado</Label>
                  <Select
                    value={
                      value.vaccinated === undefined
                        ? ""
                        : String(value.vaccinated)
                    }
                    onValueChange={(v) => {
                      if (v === "true") update({ vaccinated: true })
                      else if (v === "false") update({ vaccinated: false })
                      else remove("vaccinated")
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOL_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value || "_all"}
                          value={opt.value || "_all"}
                        >
                          {opt.label === "Sí"
                            ? "Vacunado"
                            : opt.label === "No"
                              ? "No vacunado"
                              : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sterilized */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Esterilizado</Label>
                  <Select
                    value={
                      value.sterilized === undefined
                        ? ""
                        : String(value.sterilized)
                    }
                    onValueChange={(v) => {
                      if (v === "true") update({ sterilized: true })
                      else if (v === "false") update({ sterilized: false })
                      else remove("sterilized")
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Cualquiera</SelectItem>
                      <SelectItem value="true">
                        Esterilizado / Castrado
                      </SelectItem>
                      <SelectItem value="false">
                        No esterilizado / Entero
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dewormed */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Desparasitado</Label>
                  <Select
                    value={
                      value.dewormed_internal === undefined
                        ? ""
                        : String(value.dewormed_internal)
                    }
                    onValueChange={(v) => {
                      if (v === "true") {
                        update({
                          dewormed_internal: true,
                          dewormed_external: true,
                        })
                      } else if (v === "false") {
                        update({
                          dewormed_internal: false,
                          dewormed_external: false,
                        })
                      } else {
                        const next = { ...value }
                        delete next.dewormed_internal
                        delete next.dewormed_external
                        onChange(next)
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Cualquiera</SelectItem>
                      <SelectItem value="true">Desparasitado</SelectItem>
                      <SelectItem value="false">No desparasitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Medication */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Medicamento</Label>
                  <Select
                    value={
                      value.takes_medication === undefined
                        ? ""
                        : String(value.takes_medication)
                    }
                    onValueChange={(v) => {
                      if (v === "true") update({ takes_medication: true })
                      else if (v === "false")
                        update({ takes_medication: false })
                      else remove("takes_medication")
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Cualquiera</SelectItem>
                      <SelectItem value="true">Toma medicamento</SelectItem>
                      <SelectItem value="false">
                        No toma medicamento
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Weight ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Peso
              </p>
              <div className="flex flex-wrap gap-4">
                {WEIGHT_OPTIONS.map((opt) => {
                  const checked = (value.weight_status || []).includes(
                    opt.value,
                  )
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const current = value.weight_status || []
                          let next: string[]
                          if (v) {
                            next = [...current, opt.value]
                          } else {
                            next = current.filter((x) => x !== opt.value)
                          }
                          if (next.length > 0) {
                            update({ weight_status: next })
                          } else {
                            remove("weight_status")
                          }
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* ── Supplements ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Vitaminas y suplementos
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={value.supplements?.has_vitamins === true}
                    onCheckedChange={(v) => {
                      const current = value.supplements || {}
                      const merged = { ...current, has_vitamins: !!v }
                      const next: PetFilters["supplements"] = {}
                      if (merged.has_vitamins) next.has_vitamins = true
                      if (merged.has_supplements) next.has_supplements = true
                      if (Object.keys(next).length > 0) {
                        update({ supplements: next })
                      } else {
                        remove("supplements")
                      }
                    }}
                  />
                  <span className="text-sm">Toma vitaminas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={value.supplements?.has_supplements === true}
                    onCheckedChange={(v) => {
                      const current = value.supplements || {}
                      const merged = { ...current, has_supplements: !!v }
                      const next: PetFilters["supplements"] = {}
                      if (merged.has_vitamins) next.has_vitamins = true
                      if (merged.has_supplements) next.has_supplements = true
                      if (Object.keys(next).length > 0) {
                        update({ supplements: next })
                      } else {
                        remove("supplements")
                      }
                    }}
                  />
                  <span className="text-sm">Toma suplementos</span>
                </label>
              </div>
            </div>

            <Separator />

            {/* ── Behavior ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Comportamiento
              </p>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    { key: "aggressive", label: "Es agresivo" },
                    {
                      key: "separation_anxiety",
                      label: "Ansiedad por separación",
                    },
                    { key: "phobias", label: "Tiene fobias" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={
                        value.behavior?.[opt.key] === true
                      }
                      onCheckedChange={(v) => {
                        const current = value.behavior || {}
                        const merged = { ...current, [opt.key]: !!v }
                        const next: PetFilters["behavior"] = {}
                        if (merged.aggressive) next.aggressive = true
                        if (merged.separation_anxiety) next.separation_anxiety = true
                        if (merged.phobias) next.phobias = true
                        if (Object.keys(next).length > 0) {
                          update({ behavior: next })
                        } else {
                          remove("behavior")
                        }
                      }}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* ── Identification ── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Identificación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Collar */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Collar</Label>
                  <Select
                    value={
                      value.identification?.has_collar_id === undefined
                        ? ""
                        : String(value.identification.has_collar_id)
                    }
                    onValueChange={(v) => {
                      const current = value.identification || {}
                      if (v === "true" || v === "false") {
                        update({
                          identification: {
                            ...current,
                            has_collar_id: v === "true",
                          },
                        })
                      } else {
                        // "Cualquiera" — remove collar, keep microchip if set
                        const next: PetFilters["identification"] = {}
                        if (current.has_microchip !== undefined)
                          next.has_microchip = current.has_microchip
                        if (Object.keys(next).length > 0) {
                          update({ identification: next })
                        } else {
                          remove("identification")
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Cualquiera</SelectItem>
                      <SelectItem value="true">Tiene collar</SelectItem>
                      <SelectItem value="false">No tiene collar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Microchip */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Microchip</Label>
                  <Select
                    value={
                      value.identification?.has_microchip === undefined
                        ? ""
                        : String(value.identification.has_microchip)
                    }
                    onValueChange={(v) => {
                      const current = value.identification || {}
                      if (v === "true" || v === "false") {
                        update({
                          identification: {
                            ...current,
                            has_microchip: v === "true",
                          },
                        })
                      } else {
                        // "Cualquiera" — remove microchip, keep collar if set
                        const next: PetFilters["identification"] = {}
                        if (current.has_collar_id !== undefined)
                          next.has_collar_id = current.has_collar_id
                        if (Object.keys(next).length > 0) {
                          update({ identification: next })
                        } else {
                          remove("identification")
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Cualquiera</SelectItem>
                      <SelectItem value="true">Tiene microchip</SelectItem>
                      <SelectItem value="false">No tiene microchip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
