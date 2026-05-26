import { StatsCard } from "@/components/dashboard/stats-card"
import { Wallet } from "lucide-react"

interface CreditBalanceCardProps {
  balance: number
  currency?: string
}

export function CreditBalanceCard({
  balance,
  currency = "USD",
}: CreditBalanceCardProps) {
  const formatted = balance.toLocaleString("es-EC", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return (
    <StatsCard
      title="Créditos publicitarios"
      value={formatted}
      icon={Wallet}
      description={`1 crédito = 1 ${currency} · Saldo disponible para promociones`}
    />
  )
}
