"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Sessao, Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Save, ArrowLeft, MessageCircle, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

const statusConfig = {
  agendada:  { label: "Agendada",  cls: "flash-tag--pendente" },
  realizada: { label: "Realizada", cls: "flash-tag--confirmado" },
  remarcada: { label: "Remarcada", cls: "flash-tag--orcamento" },
  faltou:    { label: "Faltou",    cls: "flash-tag--cancelado" },
}

export default function SessaoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [msgPadrao, setMsgPadrao] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [marcando, setMarcando] = useState(false)

  useEffect(() => {
    supabase.from("sessoes").select("*").eq("id", id).single().then(({ data }) => {
      setSessao(data)
      if (data?.cliente_id) {
        supabase.from("clientes").select("*").eq("id", data.cliente_id).single().then(c => setCliente(c.data))
      }
    })
    supabase.from("configuracoes").select("mensagem_whatsapp_padrao").eq("id", 1).single().then(({ data }) => {
      setMsgPadrao(data?.mensagem_whatsapp_padrao ?? "")
    })
  }, [id])

  async function salvar() {
    if (!sessao) return
    setSalvando(true)
    await supabase.from("sessoes").update({
      data: sessao.data,
      horario: sessao.horario,
      valor: sessao.valor,
      observacoes: sessao.observacoes,
    }).eq("id", id)
    setSalvando(false)
  }

  async function marcarRealizada() {
    if (!sessao) return
    setMarcando(true)
    await supabase.from("sessoes").update({ status: "realizada" }).eq("id", id)
    setSessao(s => s ? { ...s, status: "realizada" } : s)
    setMarcando(false)
  }

  async function marcarFaltou() {
    if (!sessao) return
    setMarcando(true)
    await supabase.from("sessoes").update({ status: "faltou" }).eq("id", id)
    setSessao(s => s ? { ...s, status: "faltou" } : s)
    setMarcando(false)
  }

  async function excluir() {
    if (!confirm("Excluir esta sessão?")) return
    await supabase.from("sessoes").delete().eq("id", id)
    router.push(cliente ? `/clientes/${cliente.id}` : "/sessoes")
  }

  function enviarWhatsApp() {
    if (!cliente?.celular) return
    const msg = msgPadrao
      .replace("{nome}", cliente.nome)
      .replace("{data}", sessao?.data ? new Date(sessao.data + "T12:00:00").toLocaleDateString("pt-BR") : "")
      .replace("{horario}", sessao?.horario?.slice(0, 5) ?? "")
    const numero = cliente.celular.replace(/\D/g, "")
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  if (!sessao) return <div className="p-8 text-muted-foreground">Carregando...</div>

  const status = sessao.status ?? "agendada"
  const cfg = statusConfig[status]

  return (
    <div className="p-8 space-y-6 max-w-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {cliente && (
              <Link href={`/clientes/${cliente.id}`} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                <ArrowLeft size={14} />
                {cliente.nome}
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            Sessão <Badge variant="outline">#{sessao.numero_sessao}</Badge>
            <span className={`flash-tag ${cfg.cls}`}>{cfg.label}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          {cliente?.celular && (
            <Button size="sm" variant="outline" className="gap-2" onClick={enviarWhatsApp}>
              <MessageCircle size={14} />
              WhatsApp
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={excluir}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Detalhes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={sessao.data ?? ""} onChange={e => setSessao(s => s ? { ...s, data: e.target.value } : s)} />
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" value={sessao.horario?.slice(0, 5) ?? ""} onChange={e => setSessao(s => s ? { ...s, horario: e.target.value } : s)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={sessao.valor ?? ""} onChange={e => setSessao(s => s ? { ...s, valor: Number(e.target.value) } : s)} />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={sessao.observacoes ?? ""} onChange={e => setSessao(s => s ? { ...s, observacoes: e.target.value } : s)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={salvar} disabled={salvando} className="gap-2">
          <Save size={14} />
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </Button>

        {status !== "realizada" && (
          <Button
            onClick={marcarRealizada}
            disabled={marcando}
            variant="outline"
            className="gap-2"
            style={{ borderColor: "var(--ink)", color: "var(--flash-teal)" }}
          >
            <CheckCircle2 size={14} />
            {marcando ? "Salvando..." : "Marcar como realizada"}
          </Button>
        )}

        {status !== "faltou" && status !== "realizada" && (
          <Button
            onClick={marcarFaltou}
            disabled={marcando}
            variant="outline"
            className="gap-2"
            style={{ borderColor: "var(--ink)", color: "var(--flash-red)" }}
          >
            <XCircle size={14} />
            {marcando ? "Salvando..." : "Marcar falta"}
          </Button>
        )}
      </div>
    </div>
  )
}
