"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ROUTES } from "@/lib/constants"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
} from "lucide-react"

const mobileNavItems = [
  { label: "Inicio", href: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true },
  { label: "Mis Promociones", href: ROUTES.PROMOTIONS, icon: Megaphone },
  { label: "Publicar", href: ROUTES.NEW_PROMOTION, icon: PlusCircle },
  { label: "Perfil", href: ROUTES.PROFILE, icon: User },
]

function getPageTitle(pathname: string): string {
  if (pathname === ROUTES.DASHBOARD) return "Inicio"
  if (pathname === ROUTES.NEW_PROMOTION) return "Nueva Publicación"
  if (pathname.startsWith(ROUTES.PROMOTIONS)) return "Promociones"
  if (pathname === ROUTES.PROFILE) return "Perfil"
  return "KINOO"
}

export function Topbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border/60 bg-white px-4 md:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0">
          <div className="flex items-center h-14 px-5">
            <span className="text-lg font-bold tracking-tight">KINOO</span>
            <span className="ml-2 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Panel
            </span>
          </div>
          <Separator />
          <nav className="px-3 py-3 space-y-0.5">
            {mobileNavItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
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
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">
        {getPageTitle(pathname)}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="gap-2 px-2 hover:bg-muted"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-muted text-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              {user?.full_name || "Proveedor"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={ROUTES.PROFILE} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
