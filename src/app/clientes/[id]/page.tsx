"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Anamnese, Sessao, Tatuagem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, MessageCircle, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null
  const display = typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{display}</span>
    </div>
  )
}

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const hoje = new Date().toISOString().split("T")[0]

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null)
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [tatuagens, setTatuagens] = useState<Tatuagem[]>([])
  const [msgPadrao, setMsgPadrao] = useState("")

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("*").eq("id", id).single(),
      supabase.from("anamnese").select("*").eq("cliente_id", id).maybeSingle(),
      supabase.from("sessoes").select("*").eq("cliente_id", id).order("numero_sessao"),
      supabase.from("tatuagens").select("*").eq("cliente_id", id).order("created_at"),
      supabase.from("configuracoes").select("mensagem_whatsapp_padrao").eq("id", 1).single(),
    ]).then(([c, a, s, t, cfg]) => {
      setCliente(c.data)
      setAnamnese(a.data)
      setSessoes(s.data ?? [])
      setTatuagens(t.data ?? [])
      setMsgPadrao(cfg.data?.mensagem_whatsapp_padrao ?? "")
    })
  }, [id])

  async function excluir() {
    if (!confirm("Excluir este cliente? Esta ação não pode ser desfeita.")) return
    await supabase.from("clientes").delete().eq("id", id)
    router.push("/clientes")
  }

  function abrirWhatsApp(nome?: string, data?: string, horario?: string) {
    if (!cliente?.celular) return
    const msg = msgPadrao
      .replace("{nome}", nome ?? cliente.nome)
      .replace("{data}", data ? new Date(data + "T12:00:00").toLocaleDateString("pt-BR") : "")
      .replace("{horario}", horario?.slice(0, 5) ?? "")
    const numero = cliente.celular.replace(/\D/g, "")
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  if (!cliente) return <div className="p-4 sm:p-8 text-muted-foreground">Carregando...</div>

  const sessoesPassadas = sessoes.filter(s => !s.data || s.data < hoje)
  const sessoesFuturas = sessoes.filter(s => s.data && s.data >= hoje)
  const proximaSessao = sessoesFuturas[0] ?? null

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{cliente.nome}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ficha do cliente
            {cliente.termo_aceito && <Badge variant="outline" className="ml-2 text-[10px]">Termo aceito</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          {cliente.celular && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => abrirWhatsApp(cliente.nome, proximaSessao?.data, proximaSessao?.horario)}>
              <MessageCircle size={14} />
              WhatsApp
            </Button>
          )}
          <Link href={`/clientes/${id}/editar`}>
            <Button size="sm" variant="outline" className="gap-2">
              <Pencil size={14} />
              Editar
            </Button>
          </Link>
          <Button size="sm" variant="destructive" onClick={excluir}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Dados Pessoais</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Celular" value={cliente.celular} />
            <InfoRow label="E-mail" value={cliente.email} />
            <InfoRow label="Nascimento" value={cliente.data_nascimento ? new Date(cliente.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : null} />
            <InfoRow label="Endereço" value={cliente.endereco} />
            <InfoRow label="Ocupação" value={cliente.ocupacao} />
            <InfoRow label="Indicação" value={cliente.indicacao} />
            {cliente.observacoes && <InfoRow label="Observações" value={cliente.observacoes} />}
          </CardContent>
        </Card>

        {/* Tatuagens */}
        <div className="space-y-3">
          {tatuagens.length === 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Projetos</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</p>
              </CardContent>
            </Card>
          ) : (
            tatuagens.map((tat, i) => (
              <Card key={tat.id ?? i}>
                <CardHeader><CardTitle className="text-sm">Projeto {i + 1}</CardTitle></CardHeader>
                <CardContent>
                  <InfoRow label="Ideia / Referência" value={tat.ideia_referencia} />
                  <InfoRow label="Estilo" value={tat.estilo} />
                  <InfoRow label="Local" value={tat.local_corpo} />
                  <InfoRow label="Tamanho" value={tat.tamanho_cm ? `${tat.tamanho_cm} cm` : null} />
                  <InfoRow label="Orçamento" value={tat.orcamento ? `R$ ${Number(tat.orcamento).toFixed(2)}` : null} />
                  <InfoRow label="Cobertura (cover-up)" value={tat.cobertura} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {anamnese && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Anamnese</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="Outras tatuagens" value={anamnese.tratamentos_anteriores} />
              {anamnese.tratamentos_obs && <InfoRow label="Detalhes" value={anamnese.tratamentos_obs} />}
              <InfoRow label="Doenças" value={anamnese.doencas} />
              {anamnese.doencas_obs && <InfoRow label="Quais" value={anamnese.doencas_obs} />}
              <InfoRow label="Herpes" value={anamnese.herpes} />
              <InfoRow label="Alergias" value={anamnese.alergias} />
              {anamnese.alergias_obs && <InfoRow label="Quais" value={anamnese.alergias_obs} />}
              <InfoRow label="Medicamento contínuo" value={anamnese.medicamento_continuo} />
              {anamnese.medicamento_obs && <InfoRow label="Quais" value={anamnese.medicamento_obs} />}
            </div>
            <div>
              <InfoRow label="Fumante" value={anamnese.fuma} />
              <InfoRow label="Consome álcool" value={anamnese.bebe} />
              <InfoRow label="Grávida/Amamentando" value={anamnese.gravida} />
              <InfoRow label="Isotretinoína" value={anamnese.isotretinoina} />
              <InfoRow label="Queloide" value={anamnese.historico_queloide} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessões */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Sessões ({sessoes.length})</CardTitle>
          <Link href={`/sessoes/nova?cliente=${id}`}>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus size={14} />
              Agendar sessão
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Alerta: sem sessão futura */}
          {sessoesFuturas.length === 0 && (
            <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ border: "1px solid oklch(0.55 0.19 26 / 0.25)", background: "oklch(0.55 0.19 26 / 0.07)" }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={14} style={{ color: "oklch(0.40 0.18 26)" }} className="shrink-0" />
                <span className="text-sm" style={{ color: "oklch(0.30 0.15 26)" }}>Nenhuma sessão futura agendada</span>
              </div>
              {cliente.celular && (
                <button
                  onClick={() => abrirWhatsApp(cliente.nome)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-foreground/30 bg-background"
                >
                  <MessageCircle size={12} />
                  Lembrete
                </button>
              )}
            </div>
          )}

          {/* Próximas sessões */}
          {sessoesFuturas.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Agendadas</p>
              {sessoesFuturas.map(s => (
                <Link key={s.id} href={`/sessoes/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer" style={{ border: "1px solid oklch(0.55 0.19 26 / 0.22)", background: "oklch(0.55 0.19 26 / 0.07)" }} onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.19 26 / 0.13)")} onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.55 0.19 26 / 0.07)")}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "oklch(0.55 0.19 26)", color: "oklch(0.99 0 0)" }}>
                        #{s.numero_sessao}
                      </span>
                      <span className="text-sm font-medium">
                        {s.data ? new Date(s.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }) : "—"}
                        {s.horario ? ` · ${s.horario.slice(0, 5)}` : ""}
                      </span>
                    </div>
                    {s.valor && <span className="text-sm font-semibold">R$ {Number(s.valor).toFixed(2)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Sessões passadas */}
          {sessoesPassadas.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Realizadas</p>
              {sessoesPassadas.map(s => (
                <Link key={s.id} href={`/sessoes/${s.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">#{s.numero_sessao}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {s.data ? new Date(s.data + "T12:00:00").toLocaleDateString("pt-BR") : "Data não definida"}
                        {s.horario ? ` · ${s.horario.slice(0, 5)}` : ""}
                      </span>
                    </div>
                    {s.valor && <span className="text-sm font-medium text-muted-foreground">R$ {Number(s.valor).toFixed(2)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {sessoes.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhuma sessão registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
