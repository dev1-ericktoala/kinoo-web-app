"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { getAccessToken, clearTokens } from "@/lib/auth"
import { ROUTES, ADMIN_ROLES } from "@/lib/constants"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminProvider } from "@/providers/admin-provider"
import type { UserResponse } from "@/types"

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function verify() {
      const token = getAccessToken()
      if (!token) {
        router.push(ROUTES.LOGIN)
        return
      }

      try {
        const userData = await api.users.me()
        const isAdmin = ADMIN_ROLES.includes(
          userData.role_code as (typeof ADMIN_ROLES)[number],
        )
        if (!isAdmin) {
          router.push(ROUTES.LOGIN)
          return
        }
        setUser(userData)
      } catch {
        clearTokens()
        router.push(ROUTES.LOGIN)
      } finally {
        setIsLoading(false)
      }
    }

    verify()
  }, [router])

  function handleLogout() {
    clearTokens()
    router.push(ROUTES.LOGIN)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="text-sm text-gray-500">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <AdminProvider user={user}>
      <div className="min-h-screen bg-[#f8f9fa]">
        <AdminSidebar
          userName={user.full_name || user.email}
          onLogout={handleLogout}
        />
        <main className="md:ml-[240px] min-h-screen">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </AdminProvider>
  )
}
