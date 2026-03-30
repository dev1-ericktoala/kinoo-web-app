import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth"
import { API_BASE_URL, ROUTES } from "./constants"
import type { TokenResponse } from "@/types"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) return null

    const data: TokenResponse = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } else {
      clearTokens()
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.LOGIN
      }
      throw new ApiError(401, "Sesión expirada")
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new ApiError(res.status, errorBody.detail || "Error en la solicitud")
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

// ─── API Methods ─────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string) =>
      apiClient<{ message: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    verifyCode: (email: string, code: string) =>
      apiClient<TokenResponse>("/auth/verify-register", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }),
  },

  users: {
    me: () => apiClient<import("@/types").UserResponse>("/users/me"),
    updateProfile: (data: Record<string, unknown>) =>
      apiClient<import("@/types").UserResponse>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  promotions: {
    list: (includeInactive = true) =>
      apiClient<import("@/types").Promotion[]>(
        `/admin/promotions?include_inactive=${includeInactive}`,
      ),
    get: (id: string) =>
      apiClient<import("@/types").Promotion>(`/admin/promotions/${id}`),
    create: (data: import("@/types").CreatePromotionRequest) =>
      apiClient<import("@/types").Promotion>("/admin/promotions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: import("@/types").UpdatePromotionRequest) =>
      apiClient<import("@/types").Promotion>(`/admin/promotions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    patch: (id: string, data: import("@/types").UpdatePromotionRequest) =>
      apiClient<import("@/types").Promotion>(`/admin/promotions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  lookup: {
    countries: () =>
      apiClient<import("@/types").Country[]>("/lookup/countries"),
    cities: (countryId: string) =>
      apiClient<import("@/types").City[]>(
        `/lookup/cities?country_id=${countryId}`,
      ),
  },

  places: {
    search: (query: string) =>
      apiClient<{ data: import("@/types").PlaceResult[] }>(
        `/places/search?q=${encodeURIComponent(query)}`,
      ),
  },

  locations: {
    list: (promotionId: string) =>
      apiClient<import("@/types").PromotionLocation[]>(
        `/promotions/${promotionId}/locations`,
      ),
    add: (promotionId: string, placeId: string, coverageType: import("@/types").CoverageType = "point") =>
      apiClient<import("@/types").PromotionLocation>(
        `/promotions/${promotionId}/locations`,
        {
          method: "POST",
          body: JSON.stringify({ place_id: placeId, coverage_type: coverageType }),
        },
      ),
    remove: (promotionId: string, locationId: string) =>
      apiClient<void>(`/promotions/${promotionId}/locations/${locationId}`, {
        method: "DELETE",
      }),
  },

  pets: {
    breeds: (species: string) =>
      apiClient<import("@/types").Breed[]>(
        `/pets/breeds?species=${encodeURIComponent(species)}`,
      ),
  },
}
