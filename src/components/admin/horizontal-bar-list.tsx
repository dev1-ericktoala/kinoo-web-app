import type { CountByLabel } from "@/types"

interface HorizontalBarListProps {
  data: CountByLabel[]
  maxItems?: number
  color?: string
}

export function HorizontalBarList({
  data,
  maxItems = 10,
  color = "#2563eb",
}: HorizontalBarListProps) {
  const items = data.slice(0, maxItems)
  const max = Math.max(...items.map((d) => d.count), 1)

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">Sin datos</p>
    )
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-[140px] shrink-0 truncate text-xs text-gray-600">
            {item.label}
          </span>
          <div className="relative flex-1 h-5 rounded bg-gray-100">
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: color,
                opacity: 0.2,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: color,
                opacity: 0.7,
                maxWidth: "100%",
              }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold text-gray-700 tabular-nums">
            {item.count.toLocaleString("es")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HorizontalBarListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-[140px] rounded bg-gray-200" />
          <div className="flex-1 h-5 rounded bg-gray-100" />
          <div className="h-3 w-10 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
