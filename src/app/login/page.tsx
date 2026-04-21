"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api-client"
import { setTokens } from "@/lib/auth"
import { ROUTES, ADMIN_ROLES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

type Step = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await api.auth.login(email)
      setStep("otp")
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Error al enviar el código. Intenta de nuevo.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const tokenData = await api.auth.verifyCode(email, code)
      setTokens(tokenData.access_token, tokenData.refresh_token)

      const userData = await api.users.me()
      const allowed = ["provider", "owner", "admin"]
      if (userData.role_code && allowed.includes(userData.role_code)) {
        const isAdmin = ADMIN_ROLES.includes(userData.role_code as typeof ADMIN_ROLES[number])
        router.push(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.PROMOTIONS)
      } else {
        throw new ApiError(
          403,
          "No tienes permisos para acceder al panel. Contacta al administrador.",
        )
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Código inválido. Intenta de nuevo.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[400px] shadow-lg border-border/50">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold">
            {step === "email" ? "Inicia sesión" : "Verifica tu código"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {step === "email"
              ? "Ingresa tu email para recibir un código de acceso"
              : `Enviamos un código de 6 dígitos a ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Continuar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                  autoFocus
                  disabled={isLoading}
                  className="text-center text-lg tracking-[0.5em] font-mono"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Verificar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setStep("email")
                  setCode("")
                  setError(null)
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cambiar email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
