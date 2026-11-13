"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import type { AccountingFlatFilePayload } from "@/lib/admin-api"
import { triggerBlobDownload } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

type Props = {
  onFetch: () => Promise<AccountingFlatFilePayload>
  className?: string
  fullWidth?: boolean
}

/** Parseo CSV mínimo (comillas y comas) para la vista previa. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false
  const input = text.replace(/^\uFEFF/, "")

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === ",") {
      row.push(cell)
      cell = ""
      continue
    }
    if (ch === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      continue
    }
    if (ch === "\r") continue
    cell += ch
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

function shortHeader(header: string): string {
  if (header.startsWith("Líneas de factura/")) {
    return header.slice("Líneas de factura/".length)
  }
  return header
}

/** Abre la vista previa del archivo plano y permite descargarlo. */
export function AccountingFlatFileButton({
  onFetch,
  className,
  fullWidth,
}: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<AccountingFlatFilePayload | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<string[][]>([])

  const openPreview = async () => {
    setLoading(true)
    try {
      const file = await onFetch()
      const parsed = parseCsv(file.text)
      if (parsed.length === 0) {
        throw new Error("El archivo está vacío")
      }
      setPayload(file)
      setHeaders(parsed[0] || [])
      setDataRows(parsed.slice(1))
      setOpen(true)
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "No se pudo cargar el archivo"
      toast({
        title: "No se pudo abrir el archivo",
        description,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!payload) return
    triggerBlobDownload(payload.blob, payload.filename)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        className={`${fullWidth ? "w-full " : ""}${className ?? ""}`.trim()}
        onClick={() => void openPreview()}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
        )}
        Archivo plano
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setPayload(null)
            setHeaders([])
            setDataRows([])
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Archivo plano</DialogTitle>
            <DialogDescription>
              Vista previa de los datos de la transacción
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
            {headers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                  <tr>
                    {headers.map((h) => (
                      <th
                        key={h}
                        title={h}
                        className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-foreground"
                      >
                        {shortHeader(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, idx) => (
                    <tr key={idx} className="odd:bg-background even:bg-muted/30">
                      {headers.map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="max-w-[220px] truncate border-b border-border/60 px-3 py-2 align-top text-foreground"
                          title={row[colIdx] ?? ""}
                        >
                          {(row[colIdx] ?? "").trim() === "" ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            row[colIdx]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button type="button" onClick={handleDownload} disabled={!payload}>
              <Download className="h-4 w-4 mr-1.5" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
