"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants"
import type { KnowledgeDocumentResponse } from "@/types"

interface Props {
  doc: KnowledgeDocumentResponse | null
  onClose: () => void
  onSuccess: () => void
}

export function KnowledgeEditModal({ doc, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (doc) {
      setTitle(doc.title)
      setDescription(doc.description || "")
      setCategory(doc.category || "")
      setError(null)
    }
  }, [doc])

  if (!doc) return null

  async function handleSave() {
    if (!title.trim()) {
      setError("El título es requerido")
      return
    }

    setSaving(true)
    setError(null)

    try {
      await adminApi.knowledge.update(doc!.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
      })
      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-lg mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Editar documento
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Sin categoría</option>
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-9 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
