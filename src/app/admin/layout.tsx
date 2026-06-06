import type { Metadata } from "next"
import { AdminLayoutClient } from "./admin-layout-client"
import { adminPanelMetadata } from "@/lib/site-metadata"

export const metadata: Metadata = adminPanelMetadata

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
