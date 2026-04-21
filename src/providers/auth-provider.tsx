"use client"

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api-client"
import { getAccessToken, setTokens, clearTokens } from "@/lib/auth"
import { ROUTES, ADMIN_ROLES } from "@/lib/constants"
import type { UserResponse } from "@/types"

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  login: (email: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

const ALLOWED_ROLES = ["provider", "owner", "admin"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const userData = await api.users.me()
      if (
        userData.role_code &&
        ALLOWED_ROLES.includes(userData.role_code)
      ) {
        setUser(userData)
      } else {
        clearTokens()
        setUser(null)
      }
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      fetchUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchUser])

  const login = useCallback(async (email: string) => {
    await api.auth.login(email)
  }, [])

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const tokenData = await api.auth.verifyCode(email, code)
      setTokens(tokenData.access_token, tokenData.refresh_token)

      const userData = await api.users.me()
      if (
        userData.role_code &&
        ALLOWED_ROLES.includes(userData.role_code)
      ) {
        setUser(userData)
        const isAdmin = ADMIN_ROLES.includes(userData.role_code as typeof ADMIN_ROLES[number])
        router.push(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.PROMOTIONS)
      } else {
        clearTokens()
        throw new ApiError(
          403,
          "No tienes permisos de proveedor. Contacta al administrador.",
        )
      }
    },
    [router],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    router.push(ROUTES.LOGIN)
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
