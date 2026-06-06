"use client"

import Link from "next/link"
import { ROUTES, PROMOTION_TYPE_LABELS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/promotions/status-badge"
import type { Promotion } from "@/types"

interface RecentPromotionsProps {
  promotions: Promotion[]
}

export function RecentPromotions({ promotions }: RecentPromotionsProps) {
  const recent = promotions.slice(0, 5)

  if (recent.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Publicaciones recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Aún no tienes publicaciones. ¡Crea tu primera!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Publicaciones recientes
          </CardTitle>
          <Link
            href={ROUTES.PROMOTIONS}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium"
          >
            Ver todas
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Título</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
              <TableHead className="text-xs text-right">Canjes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="text-sm font-medium">
                  <Link
                    href={ROUTES.EDIT_PROMOTION(promo.id)}
                    className="hover:text-muted-foreground transition-colors"
                  >
                    {promo.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-normal">
                    {PROMOTION_TYPE_LABELS[promo.type] || promo.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={promo.status}
                    isActive={promo.is_active}
                    reason={promo.deactivation_reason}
                    adminSuspended={promo.admin_suspended}
                    adminSuspendedReason={promo.admin_suspended_reason}
                  />
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums">
                  {promo.redemptions_count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
