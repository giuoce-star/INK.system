"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Plus, ChevronRight, FileText } from "lucide-react"

type StatusOrc = "pendente" | "aprovado" | "recusado"

interface OrcamentoRow {
  id: string
  descricao?: string
  valor?: number
  status: StatusOrc
  validade?: string
  created_at?: string
  clientes: { nome: string } | null
}

const tagCls: Record<StatusOrc, string> = {
  pendente: "flash-tag--pendente",
  aprovado: "flash-tag--confirmado",
  recusado: "flash-tag--cancelado",
}
const tagLabel: Record<StatusOrc, string> = {
  pendente: "Pendente", aprovado: "Aprovado", recusado: "Recusado",
}

export default function OrcamentosPage() {
  const supabase = useMemo(() => createClient(), [])
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | StatusOrc>("todos")

  useEffect(() => {
    supabase
      .from("orcamentos")
      .select("id, descricao, valor, status, validade, created_at, clientes(nome)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrcamentos((data as unknown as OrcamentoRow[]) ?? [])
        setLoading(false)
      })
  }, [supabase])

  const filtrados = filtro === "todos" ? orcamentos : orcamentos.filter(o => o.status === filtro)
  const total = orcamentos.reduce((a, o) => a + (o.status === "pendente" ? (o.valor ?? 0) : 0), 0)

  return (
    <div className="p-10 max-w-4xl space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            {orcamentos.length} no total · <b>R$ {total.toLocaleString("pt-BR")}</b> pendentes
          </p>
        </div>
        <Link href="/orcamentos/novo" className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "var(--flash-red)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 0 var(--ink)", fontFamily: "'Syne', sans-serif" }}>
          <Plus size={16} strokeWidth={2.5} /> Novo orçamento
        </Link>
      </div>

      {/* filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "pendente", "aprovado", "recusado"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors"
            style={filtro === f ? { background: "var(--ink)", color: "var(--paper)", border: "2px solid var(--ink)" } : { background: "var(--card)", color: "var(--muted-foreground)", border: "2px solid var(--ink)" }}>
            {f === "todos" ? "Todos" : tagLabel[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">
            {filtro === "todos" ? "Nenhum orçamento ainda." : `Nenhum orçamento ${tagLabel[filtro as StatusOrc].toLowerCase()}.`}
          </div>
        ) : (
          filtrados.map(o => (
            <Link key={o.id} href={`/orcamentos/${o.id}`}>
              <div className="group flex items-center justify-between rounded-xl px-5 py-4 cursor-pointer card-elevated">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--paper)", border: "2px solid var(--ink)" }}>
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{o.clientes?.nome ?? "—"}</p>
                    <p className="text-muted-foreground text-xs mt-0.5 truncate">{o.descricao || "Sem descrição"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-black tabular-nums hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>
                    R$ {(o.valor ?? 0).toLocaleString("pt-BR")}
                  </span>
                  <span className={`flash-tag ${tagCls[o.status]}`}>{tagLabel[o.status]}</span>
                  <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
