import Image from "next/image"
import { cn } from "@/lib/utils"

interface KynooLogoProps {
  className?: string
  /** Altura visual del logo; el ancho escala con el SVG */
  height?: number
  priority?: boolean
}

export function KynooLogo({
  className,
  height = 28,
  priority = false,
}: KynooLogoProps) {
  const width = Math.round(height * 4)

  return (
    <Image
      src="/logo.svg"
      alt="KYNOO"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  )
}
