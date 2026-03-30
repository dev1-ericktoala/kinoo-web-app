export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://appet-backend.onrender.com/api/v1"

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PROMOTIONS: "/dashboard/promotions",
  NEW_PROMOTION: "/dashboard/promotions/new",
  EDIT_PROMOTION: (id: string) => `/dashboard/promotions/${id}`,
  PROFILE: "/dashboard/profile",
} as const

export const BENEFIT_TYPE_LABELS: Record<string, string> = {
  discount: "Descuento",
  free_product: "Producto gratis",
  service: "Servicio",
  points_only: "Solo puntos",
}

export const PROMOTION_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  pending_review: "En revisión",
  rejected: "Rechazada",
}

export const PROMOTION_TYPE_LABELS: Record<string, string> = {
  promotion: "Promoción",
  service: "Servicio",
}
