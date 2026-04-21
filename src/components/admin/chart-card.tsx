"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { CountByLabel } from "@/types"

const COLORS = ["#1e3a5f", "#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"]

interface ChartCardProps {
  title: string
  children: React.ReactNode
  error?: string
  className?: string
}

export function ChartCard({ title, children, error, className }: ChartCardProps) {
  return (
    <div
      className={`rounded-lg border border-[#e5e7eb] bg-white p-5 ${className || ""}`}
    >
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      {error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : (
        children
      )}
    </div>
  )
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-[#e5e7eb] bg-white p-5 animate-pulse ${className || ""}`}
    >
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-4 h-[200px] rounded bg-gray-100" />
    </div>
  )
}

// ─── Line Chart ──────────────────────────────────────────

interface MonthlyLineChartProps {
  data: CountByLabel[]
  height?: number
}

export function MonthlyLineChart({
  data,
  height = 220,
}: MonthlyLineChartProps) {
  const formatted = data.map((d) => ({
    name: d.label.length > 7 ? d.label.slice(5) : d.label,
    value: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" width={40} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Bar Chart ───────────────────────────────────────────

interface MonthlyBarChartProps {
  data: CountByLabel[]
  height?: number
  color?: string
}

export function MonthlyBarChart({
  data,
  height = 220,
  color = "#2563eb",
}: MonthlyBarChartProps) {
  const formatted = data.map((d) => ({
    name: d.label.length > 7 ? d.label.slice(5) : d.label,
    value: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" width={40} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Donut / Pie Chart ───────────────────────────────────

interface DonutChartProps {
  data: CountByLabel[]
  height?: number
}

export function DonutChart({ data, height = 220 }: DonutChartProps) {
  const formatted = data.map((d) => ({ name: d.label, value: d.count }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
          style={{ fontSize: 11 }}
        >
          {formatted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
