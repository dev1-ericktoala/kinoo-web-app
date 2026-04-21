"use client"

import { createContext, useContext } from "react"
import type { UserResponse } from "@/types"

interface AdminContextValue {
  user: UserResponse
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({
  user,
  children,
}: {
  user: UserResponse
  children: React.ReactNode
}) {
  return (
    <AdminContext.Provider value={{ user }}>{children}</AdminContext.Provider>
  )
}

export function useAdminUser(): UserResponse {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdminUser must be used inside AdminProvider")
  return ctx.user
}
