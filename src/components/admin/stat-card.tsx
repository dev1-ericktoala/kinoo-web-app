interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  error?: string
}

export function StatCard({ label, value, subtitle, error }: StatCardProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-5">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-[#111827]">
        {typeof value === "number" ? value.toLocaleString("es") : value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>
      )}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
    </div>
  )
}
