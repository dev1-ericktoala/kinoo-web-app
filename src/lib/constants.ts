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
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_REVIEW: "/admin/review",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_EMERGENCY_CREDITS: "/admin/emergency-credits",
  ADMIN_KNOWLEDGE: "/admin/knowledge",
  ADMIN_KNOWLEDGE_DETAIL: (id: string) => `/admin/knowledge/${id}`,
} as const

export const KNOWLEDGE_CATEGORIES = [
  "nutrición",
  "vacunas",
  "comportamiento",
  "emergencias",
  "medicamentos",
  "cirugía",
  "razas",
  "otro",
] as const

export const KNOWLEDGE_CATEGORY_COLORS: Record<string, string> = {
  nutrición: "bg-green-100 text-green-800",
  vacunas: "bg-blue-100 text-blue-800",
  comportamiento: "bg-purple-100 text-purple-800",
  emergencias: "bg-red-100 text-red-800",
  medicamentos: "bg-orange-100 text-orange-800",
  cirugía: "bg-pink-100 text-pink-800",
  razas: "bg-yellow-100 text-yellow-800",
  otro: "bg-gray-100 text-gray-800",
}

export const ADMIN_ROLES = ["admin", "owner"] as const

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
