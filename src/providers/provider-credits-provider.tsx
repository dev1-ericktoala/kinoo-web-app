"use client"

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface ProviderCreditsContextType {
  balance: number | null
  isBalanceLoading: boolean
  refreshBalance: () => Promise<void>
  setBalance: (value: number) => void
}

export const ProviderCreditsContext =
  createContext<ProviderCreditsContextType | null>(null)

export function ProviderCreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isProvider = user?.role_code === "provider"

  const [balance, setBalanceState] = useState<number | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const fetchGeneration = useRef(0)

  const refreshBalance = useCallback(async () => {
    if (!isProvider) return

    const generation = ++fetchGeneration.current
    setIsBalanceLoading(true)
    try {
      const res = await api.credits.balance()
      if (fetchGeneration.current === generation) {
        setBalanceState(Number(res.balance_credits))
      }
    } catch {
      if (fetchGeneration.current === generation) {
        setBalanceState(null)
      }
    } finally {
      if (fetchGeneration.current === generation) {
        setIsBalanceLoading(false)
      }
    }
  }, [isProvider])

  const setBalance = useCallback((value: number) => {
    setBalanceState(value)
  }, [])

  useEffect(() => {
    if (!isProvider) {
      fetchGeneration.current += 1
      setBalanceState(null)
      setIsBalanceLoading(false)
      return
    }
    void refreshBalance()
  }, [isProvider, refreshBalance])

  return (
    <ProviderCreditsContext.Provider
      value={{ balance, isBalanceLoading, refreshBalance, setBalance }}
    >
      {children}
    </ProviderCreditsContext.Provider>
  )
}
