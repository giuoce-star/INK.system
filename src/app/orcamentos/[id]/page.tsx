"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Orcamento, Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Save, ArrowLeft, MessageCircle, CheckCircle2, XCircle, CalendarPlus } from "lucide-react"
import Link from "next/link"

type StatusOrc = "pendente" | "aprovado" | "recusado"
const statusCfg: Record<StatusOrc, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "flash-tag--pendente" },
  aprovado: { label: "Aprovado", cls: "flash-tag--confirmado" },
  recusado: { label: "Recusado", cls: "flash-tag--cancelado" },
}

export default function OrcamentoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [orc, setOrc] = useState<Orcamento | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [marcando, setMarcando] = useState(false)

  useEffect(() => {
    supabase.from("orcamentos").select("*").eq("id", id).single().then(({ data }) => {
      setOrc(data)
      if (data?.cliente_id) {
        supabase.from("clientes").select("*").eq("id", data.cliente_id).single().then(c => setCliente(c.data))
      }
    })
  }, [id])

  async function salvar() {
    if (!orc) return
    setSalvando(true)
    await supabase.from("orcamentos").update({
      descricao: orc.descricao, valor: orc.valor, validade: orc.validade, observacoes: orc.observacoes,
    }).eq("id", id)
    setSalvando(false)
  }

  async function mudarStatus(novo: StatusOrc) {
    if (!orc) return
    setMarcando(true)
    await supabase.from("orcamentos").update({ status: novo }).eq("id", id)
    setOrc(o => o ? { ...o, status: novo } : o)
    setMarcando(false)
  }

  async function excluir() {
    if (!confirm("Excluir este orçamento?")) return
    await supabase.from("orcamentos").delete().eq("id", id)
    router.push("/orcamentos")
  }

  function enviarWhatsApp() {
    if (!cliente?.celular) return
    const val = orc?.valor ? `R$ ${Number(orc.valor).toLocaleString("pt-BR")}` : "a combinar"
    const valid = orc?.validade ? ` Válido até ${new Date(orc.validade + "T12:00:00").toLocaleDateString("pt-BR")}.` : ""
    const msg = `Oi ${cliente.nome}! Segue o orçamento da sua tattoo${orc?.descricao ? `: ${orc.descricao}` : ""} — ${val}.${valid} Qualquer dúvida, é só chamar! 😊`
    const numero = cliente.celular.replace(/\D/g, "")
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  if (!orc) return <div className="p-4 sm:p-8 text-muted-foreground">Carregando...</div>

  const status = (orc.status ?? "pendente") as StatusOrc
  const cfg = statusCfg[status]

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-xl">
      <div className="flex items-start justify-between">
        <div>
          {cliente && (
            <Link href={`/clientes/${cliente.id}`} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-1">
              <ArrowLeft size={14} /> {cliente.nome}
            </Link>
          )}
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            Orçamento
            <span className={`flash-tag ${cfg.cls}`}>{cfg.label}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          {cliente?.celular && (
            <Button size="sm" variant="outline" className="gap-2" onClick={enviarWhatsApp}>
              <MessageCircle size={14} /> Enviar
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={excluir}><Trash2 size={14} /></Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição / ideia</Label>
            <Textarea value={orc.descricao ?? ""} onChange={e => setOrc(o => o ? { ...o, descricao: e.target.value } : o)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={orc.valor ?? ""} onChange={e => setOrc(o => o ? { ...o, valor: Number(e.target.value) } : o)} />
            </div>
            <div className="space-y-1.5">
              <Label>Válido até</Label>
              <Input type="date" value={orc.validade ?? ""} onChange={e => setOrc(o => o ? { ...o, validade: e.target.value } : o)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={orc.observacoes ?? ""} onChange={e => setOrc(o => o ? { ...o, observacoes: e.target.value } : o)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={salvar} disabled={salvando} className="gap-2">
          <Save size={14} /> {salvando ? "Salvando..." : "Salvar"}
        </Button>

        {status !== "aprovado" && (
          <Button onClick={() => mudarStatus("aprovado")} disabled={marcando} variant="outline" className="gap-2" style={{ borderColor: "var(--ink)", color: "var(--flash-teal)" }}>
            <CheckCircle2 size={14} /> Aprovar
          </Button>
        )}
        {status !== "recusado" && (
          <Button onClick={() => mudarStatus("recusado")} disabled={marcando} variant="outline" className="gap-2" style={{ borderColor: "var(--ink)", color: "var(--flash-red)" }}>
            <XCircle size={14} /> Recusar
          </Button>
        )}
        {status === "aprovado" && cliente && (
          <Link href={`/sessoes/nova?cliente=${cliente.id}`}>
            <Button variant="outline" className="gap-2" style={{ borderColor: "var(--ink)", color: "var(--flash-blue)" }}>
              <CalendarPlus size={14} /> Agendar sessão
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
