"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { KnowledgeChunkResponse } from "@/types"

interface Props {
  chunks: KnowledgeChunkResponse[]
}

export function ChunkAccordion({ chunks }: Props) {
  return (
    <div className="space-y-2">
      {chunks.map((chunk) => (
        <ChunkItem key={chunk.id} chunk={chunk} />
      ))}
    </div>
  )
}

function ChunkItem({ chunk }: { chunk: KnowledgeChunkResponse }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-900">
          Chunk #{chunk.chunk_index + 1}
        </span>
        {chunk.token_count != null && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {chunk.token_count} tokens
          </span>
        )}
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            chunk.has_embedding
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {chunk.has_embedding ? "Con embedding" : "Sin embedding"}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-3 space-y-3">
          {chunk.summary && (
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Resumen IA
              </p>
              <p className="text-sm italic text-blue-600">{chunk.summary}</p>
            </div>
          )}
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Contenido
            </p>
            <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm font-mono text-gray-700">
              {chunk.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
