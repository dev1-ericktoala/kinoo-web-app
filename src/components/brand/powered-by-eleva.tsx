import Image from "next/image"
import { cn } from "@/lib/utils"

const ELEVA_URL = "https://elevabuilds.com"

interface PoweredByElevaProps {
  className?: string
}

export function PoweredByEleva({ className }: PoweredByElevaProps) {
  return (
    <a
      href={ELEVA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground transition-opacity hover:opacity-80",
        className,
      )}
      aria-label="Powered by Eleva — elevabuilds.com"
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
        Powered by
      </span>
      <Image
        src="/eleva.svg"
        alt="Eleva"
        width={100}
        height={20}
        className="h-5 w-auto object-contain"
      />
    </a>
  )
}
