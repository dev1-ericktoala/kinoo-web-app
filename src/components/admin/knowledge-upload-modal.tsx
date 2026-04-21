"use client"

import { useState, useRef } from "react"
import { X, Upload, Loader2, FileText } from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import { KNOWLEDGE_CATEGORIES } from "@/lib/constants"

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const ACCEPTED = ".pdf,.txt,.md,.docx"
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export function KnowledgeUploadModal({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function reset() {
    setFile(null)
    setTitle("")
    setDescription("")
    setCategory("")
    setError(null)
    setUploading(false)
  }

  function handleClose() {
    if (uploading) return
    reset()
    onClose()
  }

  function validateFile(f: File): string | null {
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (!["pdf", "txt", "md", "docx"].includes(ext || "")) {
      return "Tipo de archivo no soportado. Usa PDF, TXT, MD o DOCX."
    }
    if (f.size > MAX_SIZE) {
      return "El archivo excede el tamaño máximo de 20 MB."
    }
    return null
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleSubmit() {
    if (!file) {
      setError("Selecciona un archivo")
      return
    }
    if (!title.trim()) {
      setError("El título es requerido")
      return
    }
    if (title.length > 500) {
      setError("El título no puede exceder 500 caracteres")
      return
    }

    setUploading(true)
    setError(null)

    try {
      await adminApi.knowledge.upload(
        file,
        title.trim(),
        description.trim() || undefined,
        category || undefined,
      )
      reset()
      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir documento")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Subir documento
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : file
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-emerald-500" />
                <p className="text-sm font-medium text-gray-700">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB · Click para cambiar
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Arrastra un archivo o haz click para seleccionar
                </p>
                <p className="text-xs text-gray-400">
                  PDF, TXT, MD, DOCX — máx 20 MB
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelect(f)
              }}
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              placeholder="Nombre del documento"
              className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              rows={3}
              placeholder="Descripción breve del documento (opcional)"
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Category */}
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

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="h-9 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !file || !title.trim()}
            className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Subiendo y procesando...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Subir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
