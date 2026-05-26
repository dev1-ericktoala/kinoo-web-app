"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/admin-api"
import { StatCard, StatCardSkeleton } from "@/components/admin/stat-card"
import {
  ChartCard,
  ChartCardSkeleton,
  MonthlyLineChart,
  MonthlyBarChart,
  DonutChart,
} from "@/components/admin/chart-card"
import { HorizontalBarList } from "@/components/admin/horizontal-bar-list"
import { useAdminUser } from "@/providers/admin-provider"
import { KYNOO_POINTS_BRAND } from "@/lib/constants"
import type {
  DashboardSummary,
  UsersAnalytics,
  PetsAnalytics,
  PromotionsAnalytics,
  PointsAnalytics,
  ReferralsAnalytics,
  EngagementAnalytics,
  EmergencyCreditsAnalytics,
} from "@/types"

interface DataState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

function init<T>(): DataState<T> {
  return { data: null, error: null, loading: true }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "Buenos días"
  if (hour >= 12 && hour < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function AdminDashboardPage() {
  const adminUser = useAdminUser()
  const firstName = (adminUser.full_name || adminUser.email).split(" ")[0]

  const [summary, setSummary] = useState<DataState<DashboardSummary>>(init)
  const [users, setUsers] = useState<DataState<UsersAnalytics>>(init)
  const [pets, setPets] = useState<DataState<PetsAnalytics>>(init)
  const [promotions, setPromotions] =
    useState<DataState<PromotionsAnalytics>>(init)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [points, setPoints] = useState<DataState<PointsAnalytics>>(init)
  const [referrals, setReferrals] =
    useState<DataState<ReferralsAnalytics>>(init)
  const [engagement, setEngagement] =
    useState<DataState<EngagementAnalytics>>(init)
  const [emergency, setEmergency] =
    useState<DataState<EmergencyCreditsAnalytics>>(init)

  useEffect(() => {
    async function load<T>(
      fn: () => Promise<T>,
      set: React.Dispatch<React.SetStateAction<DataState<T>>>,
    ) {
      try {
        const data = await fn()
        set({ data, error: null, loading: false })
      } catch {
        set({ data: null, error: "Error al cargar", loading: false })
      }
    }

    load(adminApi.dashboard.summary, setSummary)
    load(adminApi.dashboard.users, setUsers)
    load(adminApi.dashboard.pets, setPets)
    load(adminApi.dashboard.promotions, setPromotions)
    load(adminApi.dashboard.points, setPoints)
    load(adminApi.dashboard.referrals, setReferrals)
    load(adminApi.dashboard.engagement, setEngagement)
    load(adminApi.dashboard.emergencyCredits, setEmergency)
  }, [])

  const s = summary.data
  const u = users.data
  const p = pets.data
  const pr = promotions.data
  const r = referrals.data
  const e = emergency.data
  const en = engagement.data

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-[#111827]">
        {getGreeting()}, {firstName}
      </h1>

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Usuarios totales"
              value={s?.total_users ?? 0}
              subtitle={
                s
                  ? `+${s.users_registered_last_30d.toLocaleString("es")} últimos 30 días`
                  : undefined
              }
              error={summary.error ?? undefined}
            />
            <StatCard
              label="Mascotas totales"
              value={s?.total_pets ?? 0}
              subtitle={
                s
                  ? `${s.total_dogs.toLocaleString("es")} perros · ${s.total_cats.toLocaleString("es")} gatos`
                  : undefined
              }
              error={summary.error ?? undefined}
            />
            <StatCard
              label="Promociones activas"
              value={s?.active_promotions ?? 0}
              subtitle={
                s
                  ? `de ${s.total_promotions.toLocaleString("es")} totales`
                  : undefined
              }
              error={summary.error ?? undefined}
            />
            <StatCard
              label={`${KYNOO_POINTS_BRAND} en circulación`}
              value={
                s
                  ? (
                      s.total_points_issued - s.total_points_spent
                    ).toLocaleString("es")
                  : "0"
              }
              subtitle={
                s
                  ? `${s.total_points_issued.toLocaleString("es")} emitidos · ${s.total_points_spent.toLocaleString("es")} gastados`
                  : undefined
              }
              error={summary.error ?? undefined}
            />
          </>
        )}
      </div>

      {/* Row 2 — Growth charts + stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 5: User registrations */}
        {users.loading ? (
          <ChartCardSkeleton className="lg:col-span-1" />
        ) : (
          <ChartCard
            title="Registros usuarios (12m)"
            error={users.error ?? undefined}
          >
            {u && <MonthlyLineChart data={u.registrations_by_month} />}
          </ChartCard>
        )}

        {/* Widget 6: Pet registrations */}
        {pets.loading ? (
          <ChartCardSkeleton className="lg:col-span-1" />
        ) : (
          <ChartCard
            title="Registros mascotas (12m)"
            error={pets.error ?? undefined}
          >
            {p && (
              <MonthlyLineChart data={p.registrations_by_month} />
            )}
          </ChartCard>
        )}

        {/* Widget 7: Referrals stat */}
        {summary.loading || referrals.loading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            label="Referidos"
            value={s?.total_referrals ?? 0}
            subtitle={
              s && r
                ? `${s.validated_referrals.toLocaleString("es")} validados · ${r.conversion_rate.toFixed(1)}% conversión`
                : undefined
            }
            error={summary.error ?? referrals.error ?? undefined}
          />
        )}

        {/* Widget 8: Emergency credits stat */}
        {emergency.loading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            label="Créditos de emergencia"
            value={e?.active ?? 0}
            subtitle={
              e
                ? `activos de ${e.total_credits.toLocaleString("es")} totales`
                : undefined
            }
            error={emergency.error ?? undefined}
          />
        )}
      </div>

      {/* Row 3 — Pet segmentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 9: Top dog breeds */}
        {pets.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Top razas de perros"
            error={pets.error ?? undefined}
          >
            {p && (
              <HorizontalBarList
                data={p.top_dog_breeds}
                maxItems={10}
                color="#1e3a5f"
              />
            )}
          </ChartCard>
        )}

        {/* Widget 10: Top cat breeds */}
        {pets.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Top razas de gatos"
            error={pets.error ?? undefined}
          >
            {p && (
              <HorizontalBarList
                data={p.top_cat_breeds}
                maxItems={10}
                color="#2563eb"
              />
            )}
          </ChartCard>
        )}

        {/* Widget 11: Health distribution */}
        {pets.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Salud de mascotas"
            error={pets.error ?? undefined}
          >
            {p && <DonutChart data={p.health_score_distribution} />}
          </ChartCard>
        )}
      </div>

      {/* Row 4 — Promotions & engagement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 12: Redemptions by month */}
        {promotions.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Canjes por mes (12m)"
            error={promotions.error ?? undefined}
          >
            {pr && (
              <MonthlyBarChart
                data={pr.redemptions_by_month}
                color="#1e3a5f"
              />
            )}
          </ChartCard>
        )}

        {/* Widget 13: Top redeemed promotions */}
        {promotions.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Top promos canjeadas"
            error={promotions.error ?? undefined}
          >
            {pr && (
              <HorizontalBarList
                data={pr.top_redeemed}
                maxItems={10}
                color="#1e3a5f"
              />
            )}
          </ChartCard>
        )}

        {/* Widget 14: Top interests */}
        {engagement.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Intereses de tutores"
            error={engagement.error ?? undefined}
          >
            {en && (
              <HorizontalBarList
                data={en.top_interests}
                maxItems={10}
                color="#60a5fa"
              />
            )}
          </ChartCard>
        )}

        {/* Widget 15: Care preferences */}
        {engagement.loading ? (
          <ChartCardSkeleton />
        ) : (
          <ChartCard
            title="Preferencias de cuidado"
            error={engagement.error ?? undefined}
          >
            {en && (
              <HorizontalBarList
                data={en.top_care_preferences}
                maxItems={10}
                color="#93c5fd"
              />
            )}
          </ChartCard>
        )}
      </div>
    </div>
  )
}
