import type { Metadata } from "next"
import { DashboardLayoutClient } from "./dashboard-layout-client"
import { providerPanelMetadata } from "@/lib/site-metadata"

export const metadata: Metadata = providerPanelMetadata

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
