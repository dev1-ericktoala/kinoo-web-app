"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CREDIT_LEDGER_TYPE_LABELS } from "@/lib/constants"
import type { ProviderCreditLedgerEntry } from "@/types"

interface CreditTransactionsTableProps {
  items: ProviderCreditLedgerEntry[]
}

function formatCredits(value: number | string) {
  const n = Number(value)
  const prefix = n > 0 ? "+" : ""
  return `${prefix}${n.toLocaleString("es-EC", { maximumFractionDigits: 2 })}`
}

export function CreditTransactionsTable({ items }: CreditTransactionsTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aún no hay movimientos en tu cuenta de créditos.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((tx) => {
            const amount = Number(tx.amount_credits)
            return (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  {CREDIT_LEDGER_TYPE_LABELS[tx.type] || tx.type}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {tx.description || "—"}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    amount > 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatCredits(tx.amount_credits)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {Number(tx.balance_after).toLocaleString("es-EC")}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
