"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { RefreshCw, TrendingUp, Users, Repeat, CheckCircle2, Ticket, Cake } from "lucide-react"
import { Sticker } from "@/components/stickers"

/* ───────── helpers ───────── */
function iso(d: Date) { return d.toISOString().split("T")[0] }
const brl = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`
const mesCurto = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

interface Sessao { cliente_id: string; data: string | null; valor: number | null; status: string }
interface ClienteRel { id: string; nome: string; data_nascimento: string | null; created_at: string | null }

export default function RelatoriosPage() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [ses, setSes] = useState<Sessao[]>([])
  const [cli, setCli] = useState<ClienteRel[]>([])
  const [tats, setTats] = useState<{ estilo: string | null }[]>([])

  const load = useCallback(async () => {
    setErro(false); setLoading(true)
    try {
      const [s, c, t] = await Promise.all([
        supabase.from("sessoes").select("cliente_id, data, valor, status"),
        supabase.from("clientes").select("id, nome, data_nascimento, created_at"),
        supabase.from("tatuagens").select("estilo"),
      ])
      if (s.error || c.error || t.error) throw new Error("query")
      setSes((s.data as Sessao[]) ?? [])
      setCli((c.data as ClienteRel[]) ?? [])
      setTats((t.data as { estilo: string | null }[]) ?? [])
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const r = useMemo(() => {
    const agora = new Date()
    const hoje = iso(agora)
    const inicioMes = iso(new Date(agora.getFullYear(), agora.getMonth(), 1))
    const realizadas = ses.filter(s => s.status === "realizada")
    const comValor = realizadas.filter(s => s.valor && s.valor > 0)

    const faturamentoTotal = realizadas.reduce((a, s) => a + (s.valor ?? 0), 0)
    const faturamentoMes = realizadas.filter(s => s.data && s.data >= inicioMes).reduce((a, s) => a + (s.valor ?? 0), 0)
    const ticketMedio = comValor.length ? faturamentoTotal / comValor.length : 0

    const novosMes = cli.filter(c => c.created_at && c.created_at >= inicioMes + "T00:00:00").length

    // retorno: % de clientes com 2+ sessões realizadas (entre os que têm 1+)
    const porCli = new Map<string, number>()
    realizadas.forEach(s => porCli.set(s.cliente_id, (porCli.get(s.cliente_id) ?? 0) + 1))
    const comUma = [...porCli.values()].filter(n => n >= 1).length
    const comDuas = [...porCli.values()].filter(n => n >= 2).length
    const taxaRetorno = comUma ? Math.round((comDuas / comUma) * 100) : 0

    // comparecimento (proxy): realizadas / (realizadas + agendadas vencidas)
    const vencidasNaoRealizadas = ses.filter(s => s.status === "agendada" && s.data && s.data < hoje).length
    const denom = realizadas.length + vencidasNaoRealizadas
    const comparecimento = denom ? Math.round((realizadas.length / denom) * 100) : 100

    // sumidos: última sessão > 3 meses e sem futura
    const corte = new Date(); corte.setMonth(corte.getMonth() - 3); const corteStr = iso(corte)
    const mapa = new Map<string, { ultima: string; futura: boolean }>()
    ses.forEach(s => {
      const e = mapa.get(s.cliente_id) ?? { ultima: "", futura: false }
      if (s.data && s.data > e.ultima) e.ultima = s.data
      if (s.data && s.data >= hoje) e.futura = true
      mapa.set(s.cliente_id, e)
    })
    let sumidos = 0
    mapa.forEach(v => { if (v.ultima && !v.futura && v.ultima <= corteStr) sumidos++ })

    // faturamento últimos 6 meses
    const chart: { label: string; valor: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const ini = iso(d), fim = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))
      const v = realizadas.filter(s => s.data && s.data >= ini && s.data <= fim).reduce((a, s) => a + (s.valor ?? 0), 0)
      chart.push({ label: mesCurto[d.getMonth()], valor: v })
    }

    // aniversariantes do mês
    const mesAtual = agora.getMonth() + 1
    const aniversariantes = cli
      .filter(c => c.data_nascimento && +c.data_nascimento.split("-")[1] === mesAtual)
      .map(c => ({ id: c.id, nome: c.nome, dia: +c.data_nascimento!.split("-")[2] }))
      .sort((a, b) => a.dia - b.dia)

    // projetos por estilo (top 6)
    const estiloMap = new Map<string, number>()
    tats.forEach(t => { const e = (t.estilo || "").trim(); if (e) estiloMap.set(e, (estiloMap.get(e) ?? 0) + 1) })
    const estilos = [...estiloMap.entries()].map(([estilo, n]) => ({ estilo, n })).sort((a, b) => b.n - a.n).slice(0, 6)

    return {
      totalClientes: cli.length, novosMes, faturamentoTotal, faturamentoMes, ticketMedio,
      realizadas: realizadas.length, taxaRetorno, comparecimento, sumidos, chart, aniversariantes, estilos,
    }
  }, [ses, cli, tats])

  const maxChart = Math.max(1, ...r.chart.map(c => c.valor))
  const maxEstilo = Math.max(1, ...r.estilos.map(e => e.n))

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="page-eyebrow flex items-center gap-2"><Sticker.Estrela size={16} /> INK.SYSTEM</p>
          <h1 className="page-title mt-1">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Visão geral do estúdio</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: "var(--card)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 0 var(--ink)", fontFamily: "'Syne', sans-serif" }}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {erro && (
        <div className="flash-card-flat px-5 py-3.5" style={{ borderColor: "var(--flash-red)" }}>
          <span className="text-sm font-medium">Sem conexão com o banco. Confira as credenciais do Supabase.</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi icon={<Users size={15} />} label="Clientes" valor={loading ? "—" : String(r.totalClientes)} sub={`+${r.novosMes} este mês`} accent="var(--flash-blue)" />
        <Kpi icon={<TrendingUp size={15} />} label="Faturamento total" valor={loading ? "—" : brl(r.faturamentoTotal)} sub={`${brl(r.faturamentoMes)} este mês`} accent="var(--flash-red)" />
        <Kpi icon={<Ticket size={15} />} label="Ticket médio" valor={loading ? "—" : brl(r.ticketMedio)} sub="por sessão realizada" accent="var(--flash-gold)" />
        <Kpi icon={<CheckCircle2 size={15} />} label="Sessões realizadas" valor={loading ? "—" : String(r.realizadas)} sub="no total" accent="var(--flash-teal)" />
        <Kpi icon={<Repeat size={15} />} label="Taxa de retorno" valor={loading ? "—" : `${r.taxaRetorno}%`} sub="clientes com 2+ sessões" accent="var(--flash-purple)" />
        <Kpi icon={<CheckCircle2 size={15} />} label="Comparecimento" valor={loading ? "—" : `${r.comparecimento}%`} sub="das sessões marcadas" accent="var(--flash-teal)" />
      </div>

      {/* Faturamento por mês */}
      <section className="flash-card p-5">
        <div className="flex items-center gap-2.5">
          <Sticker.Rosa size={22} />
          <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Faturamento por mês</h2>
          <span className="text-xs text-muted-foreground">últimos 6 meses</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8">Carregando…</p>
        ) : (
          <div className="mt-5">
            <div className="flex items-end gap-3 h-48" style={{ borderBottom: "2px solid var(--ink)" }}>
              {r.chart.map((c, i) => (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
                  <span className="text-[10px] font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{c.valor >= 1000 ? `${(c.valor / 1000).toFixed(1)}k` : c.valor}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${Math.round((c.valor / maxChart) * 100)}%`, minHeight: c.valor > 0 ? 6 : 2, background: i === r.chart.length - 1 ? "var(--flash-red)" : "var(--ink)", border: "2px solid var(--ink)", borderBottom: "none", opacity: c.valor > 0 ? 1 : 0.25 }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-1.5">
              {r.chart.map((c, i) => <span key={i} className="flex-1 text-center text-[11px] text-muted-foreground font-medium">{c.label}</span>)}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aniversariantes do mês */}
        <section className="flash-card p-5">
          <div className="flex items-center gap-2.5">
            <Cake size={20} style={{ color: "var(--flash-gold)" }} />
            <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Aniversariantes do mês</h2>
          </div>
          <div className="mt-4 space-y-1">
            {loading ? <p className="text-sm text-muted-foreground py-3">Carregando…</p>
              : r.aniversariantes.length === 0 ? <p className="text-sm text-muted-foreground py-3">Nenhum aniversariante este mês.</p>
                : r.aniversariantes.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-t first:border-0" style={{ borderColor: "var(--border)" }}>
                    <Link href={`/clientes/${a.id}`} className="text-sm font-semibold hover:underline">{a.nome}</Link>
                    <span className="text-xs font-bold tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>dia {a.dia}</span>
                  </div>
                ))}
          </div>
        </section>

        {/* Projetos por estilo */}
        <section className="flash-card p-5">
          <div className="flex items-center gap-2.5">
            <Sticker.Maquina size={20} />
            <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Projetos por estilo</h2>
          </div>
          <div className="mt-4 space-y-2.5">
            {loading ? <p className="text-sm text-muted-foreground py-3">Carregando…</p>
              : r.estilos.length === 0 ? <p className="text-sm text-muted-foreground py-3">Nenhum estilo cadastrado ainda.</p>
                : r.estilos.map((e, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold capitalize">{e.estilo}</span><span className="text-muted-foreground font-bold tabular-nums">{e.n}</span></div>
                    <div className="h-2.5 rounded-full" style={{ background: "var(--track, #e5d9bf)", border: "1.5px solid var(--ink)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((e.n / maxEstilo) * 100)}%`, background: "var(--flash-red)" }} />
                    </div>
                  </div>
                ))}
          </div>
        </section>
      </div>

      {!loading && r.sumidos > 0 && (
        <div className="flash-card-flat flex items-center justify-between gap-3 px-5 py-4" style={{ borderColor: "var(--flash-red)" }}>
          <span className="text-sm"><b style={{ color: "var(--flash-red)" }}>{r.sumidos}</b> {r.sumidos === 1 ? "cliente sumido" : "clientes sumidos"} há mais de 3 meses.</span>
          <Link href="/" className="text-xs font-bold text-primary hover:underline whitespace-nowrap">Reativar no dashboard →</Link>
        </div>
      )}
    </div>
  )
}

function Kpi({ icon, label, valor, sub, accent }: { icon: React.ReactNode; label: string; valor: string; sub: string; accent: string }) {
  return (
    <div className="flash-card flash-card-hover p-5">
      <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-3xl font-black leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>{valor}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
    </div>
  )
}
