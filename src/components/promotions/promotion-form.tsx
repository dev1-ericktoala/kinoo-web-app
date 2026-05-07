"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api, ApiError } from "@/lib/api-client"
import { ROUTES } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DatePicker } from "@/components/shared/date-picker"
import {
  PetTargetingSection,
  sanitizePetFilters,
} from "./pet-targeting-section"
import {
  UserTargetingSection,
  sanitizeUserFilters,
} from "./user-targeting-section"
import { LocationPicker } from "./location-picker"
import { Loader2, ArrowLeft, Info, MapPin } from "lucide-react"
import type {
  Promotion,
  PromotionType,
  BenefitType,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PetFilters,
  UserFilters,
} from "@/types"

// ─── Schema ──────────────────────────────────────────────

const formSchema = z.object({
  type: z.enum(["promotion", "service"]),
  title: z.string().min(3, "Mínimo 3 caracteres").max(255),
  description: z.string().optional(),
  benefit_type: z.enum(["discount", "free_product", "service", "points_only"]),
  image_url: z.string().optional(),
  link: z
    .string()
    .refine((val) => val === "" || val.startsWith("https://"), {
      message: "La URL debe comenzar con https://",
    })
    .optional(),
  coupon_code: z.string().optional(),
  redeem_message: z.string().optional(),
  is_referral_only: z.boolean(),
  min_referral_points_required: z.coerce.number().min(0),
  is_single_use_per_user: z.boolean(),
  has_limited_stock: z.boolean(),
  stock_total: z.coerce.number().min(0).optional(),
  start_date: z.date(),
  end_date: z.date(),
  is_active: z.boolean(),
  is_featured_eligible: z.boolean(),
  // Service fields
  business_name: z.string().optional(),
  business_address: z.string().optional(),
  business_phone: z.string().optional(),
  business_email: z.string().optional(),
  business_whatsapp: z.string().optional(),
  service_price: z.coerce.number().min(0).optional(),
  is_presential: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

// ─── Component ───────────────────────────────────────────

interface PromotionFormProps {
  initialData?: Promotion
  mode: "create" | "edit"
}

export function PromotionForm({ initialData, mode }: PromotionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [petFilters, setPetFilters] = useState<PetFilters>(
    () =>
      (initialData?.targeting?.pet_filters as PetFilters | undefined) || {},
  )
  const [userFilters, setUserFilters] = useState<UserFilters>(
    () =>
      (initialData?.targeting?.user_filters as UserFilters | undefined) || {},
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          type: initialData.type,
          title: initialData.title,
          description: initialData.description || "",
          benefit_type: initialData.benefit_type,
          image_url: initialData.image_url || "",
          link: initialData.link || "",
          coupon_code: initialData.coupon_code || "",
          redeem_message: initialData.redeem_message || "",
          is_referral_only: initialData.is_referral_only,
          min_referral_points_required:
            initialData.min_referral_points_required,
          is_single_use_per_user: initialData.is_single_use_per_user,
          has_limited_stock: initialData.stock_total != null,
          stock_total: initialData.stock_total ?? undefined,
          start_date: new Date(initialData.start_date),
          end_date: new Date(initialData.end_date),
          is_active: initialData.is_active,
          is_featured_eligible: initialData.is_featured_eligible,
          business_name: initialData.business_name || "",
          business_address: initialData.business_address || "",
          business_phone: initialData.business_phone || "",
          business_email: initialData.business_email || "",
          business_whatsapp: initialData.business_whatsapp || "",
          service_price: initialData.service_price ?? undefined,
          is_presential: initialData.is_presential,
        }
      : {
          type: "promotion" as PromotionType,
          title: "",
          description: "",
          benefit_type: "discount" as BenefitType,
          image_url: "",
          link: "",
          coupon_code: "",
          redeem_message: "",
          is_referral_only: false,
          min_referral_points_required: 0,
          is_single_use_per_user: true,
          has_limited_stock: false,
          stock_total: undefined,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          is_active: true,
          is_featured_eligible: false,
          business_name: "",
          business_address: "",
          business_phone: "",
          business_email: "",
          business_whatsapp: "",
          service_price: undefined,
          is_presential: true,
        },
  })

  const watchType = form.watch("type")
  const watchHasLimitedStock = form.watch("has_limited_stock")
  const watchIsReferralOnly = form.watch("is_referral_only")

  async function onSubmit(values: FormValues) {
    if (values.end_date <= values.start_date) {
      form.setError("end_date", {
        message: "La fecha de fin debe ser posterior a la de inicio",
      })
      return
    }

    setIsSubmitting(true)

    const targeting: Record<string, unknown> = {}
    // Sanitize: drop empty arrays and any value outside the API allow-list
    // so the backend doesn't 422 on stale or unknown values.
    const cleanedPetFilters = sanitizePetFilters(petFilters)
    if (Object.keys(cleanedPetFilters).length > 0) {
      targeting.pet_filters = cleanedPetFilters
    }
    const cleanedUserFilters = sanitizeUserFilters(userFilters)
    if (Object.keys(cleanedUserFilters).length > 0) {
      targeting.user_filters = cleanedUserFilters
    }

    const payload = {
      type: values.type,
      title: values.title,
      description: values.description || null,
      benefit_type: values.benefit_type,
      image_url: values.image_url || null,
      link: values.link || null,
      coupon_code: values.coupon_code || null,
      redeem_message: values.redeem_message || null,
      points_required: 0,
      points_cost: 0,
      is_referral_only: values.is_referral_only,
      min_referral_points_required: values.min_referral_points_required,
      is_single_use_per_user: values.is_single_use_per_user,
      stock_total: values.has_limited_stock ? (values.stock_total ?? null) : null,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date.toISOString(),
      is_active: values.is_active,
      is_featured_eligible: values.is_featured_eligible,
      country_id: null,
      city_id: null,
      targeting,
      business_name: values.business_name || null,
      business_address: values.business_address || null,
      business_phone: values.business_phone || null,
      business_email: values.business_email || null,
      business_whatsapp: values.business_whatsapp || null,
      service_price: values.service_price ?? null,
      is_presential: values.is_presential,
    }

    try {
      if (mode === "create") {
        const created = await api.promotions.create(payload as CreatePromotionRequest)
        toast({
          title: "Publicación creada",
          description: "Ahora puedes agregar ubicaciones en el mapa.",
        })
        // Redirect to edit page so LocationPicker is immediately available
        router.push(ROUTES.EDIT_PROMOTION(created.id))
        return
      } else if (initialData) {
        await api.promotions.update(
          initialData.id,
          payload as UpdatePromotionRequest,
        )
        toast({
          title: "Publicación actualizada",
          description: "Los cambios se guardaron correctamente.",
        })
      }
      router.push(ROUTES.PROMOTIONS)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError
            ? err.message
            : "No se pudo guardar la publicación.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => router.push(ROUTES.PROMOTIONS)}
        className="text-muted-foreground -ml-2"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver
      </Button>

      {/* Type selection */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tipo de publicación</CardTitle>
          <CardDescription className="text-xs">
            Elige si quieres publicar una promoción o un servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(["promotion", "service"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => form.setValue("type", t)}
                className={`flex-1 rounded-lg border-2 p-4 text-center transition-colors ${
                  watchType === t
                    ? "border-foreground bg-muted/50"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <p className="text-sm font-medium">
                  {t === "promotion" ? "Promoción" : "Servicio"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t === "promotion"
                    ? "Descuentos, productos gratis, cupones"
                    : "Servicios presenciales o virtuales"}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-medium">
              Título *
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Nombre de tu publicación"
              className="h-9"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">
              Descripción
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe tu publicación..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipo de beneficio *</Label>
            <Select
              value={form.watch("benefit_type")}
              onValueChange={(v) =>
                form.setValue("benefit_type", v as BenefitType)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Descuento</SelectItem>
                <SelectItem value="free_product">Producto gratis</SelectItem>
                <SelectItem value="service">Servicio</SelectItem>
                <SelectItem value="points_only">Solo puntos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-xs font-medium">
              URL de imagen
            </Label>
            <Input
              id="image_url"
              {...form.register("image_url")}
              placeholder="https://..."
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Redemption / Coupon */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Canje y cupones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon_code" className="text-xs font-medium">
                Código de cupón
              </Label>
              <Input
                id="coupon_code"
                {...form.register("coupon_code")}
                placeholder="DESCUENTO20"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link" className="text-xs font-medium">
                URL externa
              </Label>
              <Input
                id="link"
                {...form.register("link")}
                placeholder="https://..."
                className="h-9"
              />
              {form.formState.errors.link && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.link.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redeem_message" className="text-xs font-medium">
              Mensaje de canje
            </Label>
            <Textarea
              id="redeem_message"
              {...form.register("redeem_message")}
              placeholder="Muestra esta pantalla en el checkout..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Referidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Solo por referidos</Label>
              <p className="text-xs text-muted-foreground">
                Solo usuarios con referidos pueden acceder
              </p>
            </div>
            <Switch
              checked={watchIsReferralOnly}
              onCheckedChange={(v) => form.setValue("is_referral_only", v)}
            />
          </div>

          {watchIsReferralOnly && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Puntos mínimos de referidos
              </Label>
              <Input
                type="number"
                min={0}
                {...form.register("min_referral_points_required")}
                className="h-9 w-[200px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Uso único por usuario</Label>
              <p className="text-xs text-muted-foreground">
                Cada usuario solo puede canjear una vez
              </p>
            </div>
            <Switch
              checked={form.watch("is_single_use_per_user")}
              onCheckedChange={(v) => form.setValue("is_single_use_per_user", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Stock y disponibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Stock limitado</Label>
              <p className="text-xs text-muted-foreground">
                Limitar la cantidad de canjes disponibles
              </p>
            </div>
            <Switch
              checked={watchHasLimitedStock}
              onCheckedChange={(v) => form.setValue("has_limited_stock", v)}
            />
          </div>

          {watchHasLimitedStock && (
            <div className="space-y-2">
              <Label htmlFor="stock_total" className="text-xs font-medium">
                Stock total
              </Label>
              <Input
                id="stock_total"
                type="number"
                min={0}
                {...form.register("stock_total")}
                className="h-9 w-[200px]"
              />
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Fecha de inicio *</Label>
              <DatePicker
                value={form.watch("start_date")}
                onChange={(d) => d && form.setValue("start_date", d)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Fecha de fin *</Label>
              <DatePicker
                value={form.watch("end_date")}
                onChange={(d) => d && form.setValue("end_date", d)}
              />
              {form.formState.errors.end_date && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location — Geo-targeting via map */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Ubicación</CardTitle>
          <CardDescription className="text-xs">
            Configura la ubicación para geo-targeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "edit" && initialData ? (
            <LocationPicker
              promotionId={initialData.id}
              promotionType={watchType}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="rounded-full bg-muted p-3">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Guarda la publicación primero
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Después de crear la publicación podrás agregar ubicaciones en el mapa
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Targeting — user + pet filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h3 className="text-sm font-semibold">Segmentación de la audiencia</h3>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Cómo funcionan los filtros"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Mostraremos la promoción a usuarios que coincidan en TODOS los
                filtros activos. Dentro de cada filtro basta con que cumplan
                UNO de los valores seleccionados.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <UserTargetingSection value={userFilters} onChange={setUserFilters} />
        <PetTargetingSection value={petFilters} onChange={setPetFilters} />
      </div>

      {/* Service-specific fields */}
      {watchType === "service" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Datos del negocio
            </CardTitle>
            <CardDescription className="text-xs">
              Información visible para los usuarios del servicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-xs font-medium">
                Nombre del negocio
              </Label>
              <Input
                id="business_name"
                {...form.register("business_name")}
                placeholder="Mi Negocio"
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_address" className="text-xs font-medium">
                Dirección
              </Label>
              <Input
                id="business_address"
                {...form.register("business_address")}
                placeholder="Calle 123, Ciudad"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_phone" className="text-xs font-medium">
                  Teléfono
                </Label>
                <Input
                  id="business_phone"
                  {...form.register("business_phone")}
                  placeholder="+1234567890"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="business_whatsapp"
                  className="text-xs font-medium"
                >
                  WhatsApp
                </Label>
                <Input
                  id="business_whatsapp"
                  {...form.register("business_whatsapp")}
                  placeholder="+1234567890"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email" className="text-xs font-medium">
                Email de contacto
              </Label>
              <Input
                id="business_email"
                type="email"
                {...form.register("business_email")}
                placeholder="contacto@minegocio.com"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_price" className="text-xs font-medium">
                  Precio del servicio
                </Label>
                <Input
                  id="service_price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...form.register("service_price")}
                  placeholder="0.00"
                  className="h-9"
                />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label className="text-xs font-medium">Servicio presencial</Label>
                <Switch
                  checked={form.watch("is_presential")}
                  onCheckedChange={(v) => form.setValue("is_presential", v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Publicación activa</Label>
              <p className="text-xs text-muted-foreground">
                Si está activa, será visible para los usuarios
              </p>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Elegible para destacada</Label>
              <p className="text-xs text-muted-foreground">
                Permite que esta publicación sea destacada
              </p>
            </div>
            <Switch
              checked={form.watch("is_featured_eligible")}
              onCheckedChange={(v) => form.setValue("is_featured_eligible", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px] bg-[#4a6b1e] hover:bg-[#3d5a18] text-white">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Crear publicación" : "Guardar cambios"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(ROUTES.PROMOTIONS)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
