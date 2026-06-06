"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { adminApi } from "@/lib/admin-api"
import type { UserResponse } from "@/types"

interface AdminContextValue {
  user: UserResponse
  pendingReviewCount: number
  pendingFulfillmentCount: number
  refreshBadgeCounts: () => Promise<void>
  notifyPendingReviewProcessed: (count?: number) => void
  notifyPendingFulfillmentProcessed: (count?: number) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({
  user,
  children,
}: {
  user: UserResponse
  children: React.ReactNode
}) {
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [pendingFulfillmentCount, setPendingFulfillmentCount] = useState(0)

  const refreshBadgeCounts = useCallback(async () => {
    const [reviews, fulfillments] = await Promise.all([
      adminApi.promotionReview.listPending().catch(() => []),
      adminApi.promotionFulfillments
        .list({ status: "submitted", limit: 1, offset: 0 })
        .catch(() => null),
    ])

    setPendingReviewCount(reviews.length)
    if (fulfillments) {
      setPendingFulfillmentCount(fulfillments.total)
    }
  }, [])

  useEffect(() => {
    void refreshBadgeCounts()
  }, [refreshBadgeCounts])

  const notifyPendingReviewProcessed = useCallback((count = 1) => {
    setPendingReviewCount((prev) => Math.max(0, prev - count))
  }, [])

  const notifyPendingFulfillmentProcessed = useCallback((count = 1) => {
    setPendingFulfillmentCount((prev) => Math.max(0, prev - count))
  }, [])

  return (
    <AdminContext.Provider
      value={{
        user,
        pendingReviewCount,
        pendingFulfillmentCount,
        refreshBadgeCounts,
        notifyPendingReviewProcessed,
        notifyPendingFulfillmentProcessed,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminUser(): UserResponse {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdminUser must be used inside AdminProvider")
  return ctx.user
}

export function useAdminBadges() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdminBadges must be used inside AdminProvider")
  return {
    pendingReviewCount: ctx.pendingReviewCount,
    pendingFulfillmentCount: ctx.pendingFulfillmentCount,
    refreshBadgeCounts: ctx.refreshBadgeCounts,
    notifyPendingReviewProcessed: ctx.notifyPendingReviewProcessed,
    notifyPendingFulfillmentProcessed: ctx.notifyPendingFulfillmentProcessed,
  }
}
