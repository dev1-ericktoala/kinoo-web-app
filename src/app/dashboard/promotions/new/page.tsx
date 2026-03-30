"use client"

import { PromotionForm } from "@/components/promotions/promotion-form"

export default function NewPromotionPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Nueva publicación</h2>
      <PromotionForm mode="create" />
    </div>
  )
}
