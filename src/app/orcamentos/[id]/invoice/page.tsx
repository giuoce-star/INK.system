"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Orcamento, Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, MessageCircle } from "lucide-react"
import { Sticker } from "@/components/stickers"

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [orc, setOrc] = useState<Orcamento | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [estudio, setEstudio] = useState<{ nome?: string; contato?: string }>({})

  useEffect(() => {
    supabase.from("orcamentos").select("*").eq("id", id).single().then(({ data }) => {
      setOrc(data)
      if (data?.cliente_id) {
        supabase.from("clientes").select("*").eq("id", data.cliente_id).single().then(c => setCliente(c.data))
      }
    })
    supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      setEstudio({ nome: data?.nome_estudio ?? undefined, contato: data?.contato_estudio ?? undefined })
    })
  }, [id])

  function enviarWhatsApp() {
    if (!cliente?.celular) return
    const val = orc?.valor ? `R$ ${Number(orc.valor).toLocaleString("pt-BR")}` : "a combinar"
    const msg = `Oi ${cliente.nome}! Segue o orçamento da sua tattoo${orc?.descricao ? `: ${orc.descricao}` : ""} — ${val}. Qualquer dúvida, é só chamar! 😊`
    window.open(`https://wa.me/55${cliente.celular.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  if (!orc) return <div className="p-4 sm:p-8 text-muted-foreground">Carregando...</div>

  const numero = `#${id.slice(0, 8).toUpperCase()}`
  const emissao = orc.created_at ? new Date(orc.created_at).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")
  const nomeEstudio = estudio.nome || "INK.system"

  return (
    <div className="p-4 sm:p-8 max-w-2xl space-y-5">

      {/* Ações — não saem na impressão */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <Link href={`/orcamentos/${id}`} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Voltar ao orçamento
        </Link>
        <div className="flex gap-2">
          {cliente?.celular && (
            <Button size="sm" variant="outline" className="gap-2" onClick={enviarWhatsApp}>
              <MessageCircle size={14} /> WhatsApp
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* ─── O documento ─── */}
      <div className="invoice flash-card p-6 sm:p-9">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Sticker.Rosa size={44} />
            <div>
              <p className="text-xl font-black leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>{nomeEstudio}</p>
              {estudio.contato && <p className="text-xs text-muted-foreground mt-1">{estudio.contato}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: "var(--flash-red)", fontFamily: "'Syne', sans-serif" }}>Orçamento</p>
            <p className="text-sm font-black font-mono mt-0.5">{numero}</p>
            <p className="text-xs text-muted-foreground">{emissao}</p>
          </div>
        </div>

        <div className="h-[3px] my-6 rounded-full" style={{ background: "linear-gradient(90deg, var(--flash-red), transparent)" }} />

        {/* Cliente */}
        <div className="mb-6">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>Para</p>
          <p className="text-base font-bold">{cliente?.nome ?? "—"}</p>
          <p className="text-sm text-muted-foreground">
            {[cliente?.celular, cliente?.email].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        {/* Projeto */}
        <div className="mb-6">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>Projeto</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{orc.descricao || "—"}</p>
        </div>

        {/* Valor */}
        <div className="rounded-xl px-5 py-4 flex items-end justify-between gap-4 flex-wrap"
          style={{ border: "2px solid var(--ink)", background: "var(--paper)" }}>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>Valor</p>
            <p className="text-3xl font-black leading-none mt-1" style={{ fontFamily: "'Syne', sans-serif", color: "var(--flash-red)" }}>
              {orc.valor ? `R$ ${Number(orc.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "A combinar"}
            </p>
          </div>
          {orc.validade && (
            <div className="text-right">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>Válido até</p>
              <p className="text-sm font-bold mt-1">{new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR")}</p>
            </div>
          )}
        </div>

        {/* Observações */}
        {orc.observacoes && (
          <div className="mt-6">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>Observações</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{orc.observacoes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 pt-5 text-center" style={{ borderTop: "2px solid var(--border)" }}>
          <p className="text-xs text-muted-foreground">
            Orçamento sujeito a alteração após avaliação presencial. Obrigada pela confiança! 🌹
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 tracking-[0.2em] uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            {nomeEstudio}
          </p>
        </div>
      </div>

      <p className="no-print text-xs text-muted-foreground text-center">
        Dica: clique em <b>Imprimir / Salvar PDF</b> e escolha &quot;Salvar como PDF&quot; para enviar ao cliente.
      </p>
    </div>
  )
}
