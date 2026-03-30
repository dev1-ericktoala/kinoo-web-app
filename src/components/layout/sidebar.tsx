"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  User,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  {
    label: "Inicio",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Mis Promociones",
    href: ROUTES.PROMOTIONS,
    icon: Megaphone,
  },
  {
    label: "Publicar",
    href: ROUTES.NEW_PROMOTION,
    icon: PlusCircle,
  },
  {
    label: "Perfil",
    href: ROUTES.PROFILE,
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex md:w-[240px] md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-1 bg-white border-r border-border/60">
        {/* Logo */}
        <div className="flex items-center h-14 px-5">
          <Link
            href={ROUTES.DASHBOARD}
            className="text-lg font-bold tracking-tight text-foreground"
          >
            KINOO
          </Link>
          <span className="ml-2 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            Panel
          </span>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border/60">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  )
}
