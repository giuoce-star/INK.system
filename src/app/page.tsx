"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Search, Bell, Plus, ArrowUpRight, ArrowDownRight,
  Clock, ChevronRight, AlertTriangle, RefreshCw,
} from "lucide-react"
import { Sticker } from "@/components/stickers"

/* ───────────────────────── Tipos ───────────────────────── */

type StatusSessao = "agendada" | "realizada" | "remarcada"

interface SessaoRow {
  id: string
  numero_sessao?: number
  data?: string
  horario?: string
  observacoes?: string
  status?: StatusSessao
  clientes: { nome: string } | null
}

/* ───────────────────────── Helpers ───────────────────────── */

function dataHoje() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
}

function iso(d: Date) { return d.toISOString().split("T")[0] }

function StatusTag({ status }: { status?: StatusSessao }) {
  const map: Record<StatusSessao, { cls: string; label: string }> = {
    agendada: { cls: "pendente", label: "Agendada" },
    realizada: { cls: "confirmado", label: "Realizada" },
    remarcada: { cls: "orcamento", label: "Remarcada" },
  }
  const s = map[status ?? "agendada"] ?? map.agendada
  return <span className={`flash-tag flash-tag--${s.cls}`}>{s.label}</span>
}

const diasSemanaCurto = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

/* ───────────────────────── Página ───────────────────────── */

export default function Dashboard() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  const [totalClientes, setTotalClientes] = useState(0)
  const [novosClientes, setNovosClientes] = useState(0)
  const [projetos, setProjetos] = useState(0)
  const [agendaHoje, setAgendaHoje] = useState<SessaoRow[]>([])
  const [agendadosHoje, setAgendadosHoje] = useState(0)
  const [agendadosOntem, setAgendadosOntem] = useState(0)
  const [proximos, setProximos] = useState<SessaoRow[]>([])
  const [receitaMes, setReceitaMes] = useState(0)
  const [receitaMesAnterior, setReceitaMesAnterior] = useState(0)
  const [chart, setChart] = useState<{ label: string; valor: number }[]>([])

  const load = useCallback(async () => {
    setErro(false)
    try {
      const agora = new Date()
      const hoje = iso(agora)
      const ontem = new Date(agora); ontem.setDate(ontem.getDate() - 1)
      const inicioMes = iso(new Date(agora.getFullYear(), agora.getMonth(), 1))
      const fimMes = iso(new Date(agora.getFullYear(), agora.getMonth() + 1, 0))
      const inicioMesAnt = iso(new Date(agora.getFullYear(), agora.getMonth() - 1, 1))
      const fimMesAnt = iso(new Date(agora.getFullYear(), agora.getMonth(), 0))
      const seteDias = new Date(agora); seteDias.setDate(seteDias.getDate() - 6)

      const [
        { count: totalC, error: e1 },
        { count: novosC, error: e2 },
        { count: projC, error: e3 },
        { data: hojeRows, error: e4 },
        { count: ontemC, error: e5 },
        { data: proxRows, error: e6 },
        { data: realizadas7d, error: e7 },
        { data: realizadasMes, error: e8 },
        { data: realizadasMesAnt, error: e9 },
      ] = await Promise.all([
        supabase.from("clientes").select("*", { count: "exact", head: true }),
        supabase.from("clientes").select("*", { count: "exact", head: true }).gte("created_at", inicioMes),
        supabase.from("tatuagens").select("*", { count: "exact", head: true }),
        supabase.from("sessoes").select("id, horario, observacoes, status, clientes(nome)").eq("data", hoje).order("horario", { ascending: true }),
        supabase.from("sessoes").select("id", { count: "exact", head: true }).eq("data", iso(ontem)).eq("status", "agendada"),
        supabase.from("sessoes").select("id, numero_sessao, data, horario, observacoes, clientes(nome)").gte("data", hoje).eq("status", "agendada").order("data", { ascending: true }).limit(5),
        supabase.from("sessoes").select("valor, data").eq("status", "realizada").gte("data", iso(seteDias)).lte("data", hoje),
        supabase.from("sessoes").select("valor").eq("status", "realizada").gte("data", inicioMes).lte("data", fimMes),
        supabase.from("sessoes").select("valor").eq("status", "realizada").gte("data", inicioMesAnt).lte("data", fimMesAnt),
      ])

      if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9) throw new Error("query")

      setTotalClientes(totalC ?? 0)
      setNovosClientes(novosC ?? 0)
      setProjetos(projC ?? 0)

      const hj = (hojeRows as unknown as SessaoRow[]) ?? []
      setAgendaHoje(hj)
      setAgendadosHoje(hj.filter(s => (s.status ?? "agendada") === "agendada").length)
      setAgendadosOntem(ontemC ?? 0)
      setProximos((proxRows as unknown as SessaoRow[]) ?? [])

      const somaValor = (rows: { valor: number | null }[] | null) =>
        (rows ?? []).reduce((acc, r) => acc + (r.valor ?? 0), 0)
      setReceitaMes(somaValor(realizadasMes))
      setReceitaMesAnterior(somaValor(realizadasMesAnt))

      // gráfico: últimos 7 dias
      const buckets: { label: string; valor: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(agora); d.setDate(d.getDate() - i)
        buckets.push({ label: diasSemanaCurto[d.getDay()], valor: 0 })
      }
      for (const r of (realizadas7d as { valor: number | null; data: string }[] | null) ?? []) {
        const d = new Date(r.data + "T12:00:00")
        const idx = 6 - Math.floor((agora.getTime() - d.getTime()) / 86400000)
        if (idx >= 0 && idx < 7) buckets[idx].valor += r.valor ?? 0
      }
      setChart(buckets)
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const trendAgenda = agendadosHoje - agendadosOntem
  const trendReceita = receitaMesAnterior > 0
    ? Math.round(((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100)
    : undefined

  function fmtReceita(v: number) {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
    return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
  }

  const maxChart = Math.max(1, ...chart.map(c => c.valor))

  return (
    <div className="min-h-screen">

      {/* ─── Barra superior ─── */}
      <header className="sticky top-0 z-20 flex items-center gap-4 px-8 py-3.5 bg-background/85 backdrop-blur border-b-2 border-black">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar cliente, projeto, orçamento…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-card outline-none"
            style={{ border: "2px solid var(--ink)" }}
          />
        </div>
        <div className="flex-1" />
        <button className="relative w-9 h-9 rounded-full flex items-center justify-center bg-card" style={{ border: "2px solid var(--ink)" }} title="Notificações">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: "var(--flash-red)", border: "2px solid var(--ink)", fontFamily: "'Syne', sans-serif" }}>G</div>
          <div className="leading-tight">
            <p className="text-xs font-bold">Meu Estúdio</p>
            <p className="text-[10px] text-muted-foreground">Tatuador(a)</p>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">

        {/* Banner de conexão */}
        {erro && (
          <div className="flash-card-flat flex items-center justify-between px-5 py-3.5" style={{ borderColor: "var(--flash-red)" }}>
            <span className="text-sm font-medium">Sem conexão com o banco. Confira as credenciais do Supabase.</span>
            <button onClick={load} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "var(--flash-red)" }}>
              <RefreshCw size={13} /> Tentar de novo
            </button>
          </div>
        )}

        {/* ─── Título + ações ─── */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <Sticker.Estrela size={16} /> INK.SYSTEM
            </p>
            <h1 className="page-title mt-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1.5 capitalize">{dataHoje()}</p>
          </div>
          <div className="flex gap-2.5">
            <Link href="/sessoes/nova" className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: "var(--flash-red)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 0 var(--ink)", fontFamily: "'Syne', sans-serif" }}>
              <Plus size={16} strokeWidth={2.5} /> Novo agendamento
            </Link>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: "var(--card)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 0 var(--ink)", fontFamily: "'Syne', sans-serif" }}>
              <Plus size={16} strokeWidth={2.5} /> Novo orçamento
            </button>
          </div>
        </div>

        {/* ─── Cards de métrica ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Agendamentos hoje" valor={loading ? "—" : String(agendadosHoje)} sub="sessões"
            trend={loading ? undefined : trendAgenda} trendLabel="vs ontem" trendUnit=""
            sticker={<Sticker.Andorinha size={46} />} accent="var(--flash-teal)"
          />
          <MetricCard
            label="Faturamento do mês" valor={loading ? "—" : fmtReceita(receitaMes)} sub="sessões realizadas"
            trend={loading ? undefined : trendReceita} trendLabel="vs mês anterior" trendUnit="%"
            sticker={<Sticker.Rosa size={46} />} accent="var(--flash-red)"
          />
          <MetricCard
            label="Novos clientes" valor={loading ? "—" : String(novosClientes)} sub="este mês"
            sticker={<Sticker.Coracao size={46} />} accent="var(--flash-gold)"
          />
          <MetricCard
            label="Projetos em andamento" valor={loading ? "—" : String(projetos)} sub="tatuagens abertas"
            link="/clientes" linkLabel="Ver todos"
            sticker={<Sticker.Maquina size={46} />} accent="var(--flash-blue)"
          />
        </div>

        {/* ─── Grid principal ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna esquerda */}
          <div className="lg:col-span-2 space-y-6">

            {/* Agenda do dia */}
            <section className="flash-card p-5">
              <SectionTitle icon={<Sticker.Adaga size={22} />} title="Agenda do dia" right={<Link href="/sessoes" className="text-xs font-bold text-primary hover:underline">Ver agenda completa →</Link>} />
              <div className="mt-4 overflow-x-auto">
                {loading ? (
                  <p className="text-sm text-muted-foreground py-6">Carregando…</p>
                ) : agendaHoje.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">Nenhuma sessão hoje.</p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
                        <th className="pb-2 font-bold">Horário</th>
                        <th className="pb-2 font-bold">Cliente</th>
                        <th className="pb-2 font-bold">Tattoo / obs.</th>
                        <th className="pb-2 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agendaHoje.map(s => (
                        <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="py-3 font-mono font-bold tabular-nums">{s.horario ? s.horario.slice(0, 5) : "—"}</td>
                          <td className="py-3 font-semibold">{s.clientes?.nome ?? "—"}</td>
                          <td className="py-3 text-muted-foreground">{s.observacoes || "—"}</td>
                          <td className="py-3 text-right"><StatusTag status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Gráfico de faturamento */}
            <section className="flash-card p-5">
              <SectionTitle icon={<Sticker.Estrela size={22} />} title="Faturamento" right={<span className="text-xs font-bold text-muted-foreground">últimos 7 dias</span>} />
              <BarChart dados={chart} maxVal={maxChart} loading={loading} />
            </section>
          </div>

          {/* Coluna direita */}
          <div className="space-y-6">

            {/* Próximos agendamentos */}
            <section className="flash-card p-5">
              <SectionTitle icon={<Sticker.Andorinha size={22} />} title="Próximos agendamentos" />
              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : proximos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
                ) : proximos.map(p => (
                  <Link key={p.id} href={`/sessoes/${p.id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: "var(--flash-red)", border: "2px solid var(--ink)", fontFamily: "'Syne', sans-serif" }}>
                      {(p.clientes?.nome ?? "?").split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:underline">{p.clientes?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.observacoes || `Sessão #${p.numero_sessao ?? ""}`}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold">{p.data ? new Date(p.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : "—"}</p>
                      {p.horario && <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end"><Clock size={10} />{p.horario.slice(0, 5)}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Orçamentos pendentes — em breve */}
            <section className="flash-card p-5">
              <SectionTitle icon={<Sticker.Ancora size={20} />} title="Orçamentos pendentes" right={<span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">em breve</span>} />
              <p className="mt-3 text-sm text-muted-foreground">Módulo de orçamentos em construção.</p>
            </section>

            {/* Estoque baixo — em breve */}
            <section className="flash-card p-5">
              <SectionTitle icon={<AlertTriangle size={18} style={{ color: "var(--flash-red)" }} />} title="Estoque baixo" right={<span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">em breve</span>} />
              <p className="mt-3 text-sm text-muted-foreground">Módulo de estoque em construção.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Componentes ───────────────────────── */

function SectionTitle({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      </div>
      {right}
    </div>
  )
}

function MetricCard({ label, valor, sub, trend, trendLabel, trendUnit = "", link, linkLabel, sticker, accent }: {
  label: string; valor: string; sub: string
  trend?: number; trendLabel?: string; trendUnit?: string
  link?: string; linkLabel?: string
  sticker: React.ReactNode; accent: string
}) {
  const up = (trend ?? 0) >= 0
  return (
    <div className="flash-card flash-card-hover p-5 overflow-hidden">
      <div className="absolute -top-1 -right-1 rotate-12 opacity-90 pointer-events-none">{sticker}</div>
      <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: accent }} />
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-4xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>{valor}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2.5 text-xs font-bold" style={{ color: up ? "var(--flash-teal)" : "var(--flash-red)" }}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {up ? "+" : ""}{trend}{trendUnit} <span className="text-muted-foreground font-normal">{trendLabel}</span>
        </div>
      )}
      {link && (
        <Link href={link} className="flex items-center gap-1 mt-2.5 text-xs font-bold text-primary hover:underline">
          {linkLabel} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  )
}

function BarChart({ dados, maxVal, loading }: { dados: { label: string; valor: number }[]; maxVal: number; loading: boolean }) {
  if (loading) return <div className="mt-5 h-44 flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>
  const temDados = dados.some(d => d.valor > 0)
  return (
    <div className="mt-5">
      <div className="flex items-end gap-2 h-44" style={{ borderBottom: "2px solid var(--ink)" }}>
        {dados.map((d, i) => {
          const h = Math.round((d.valor / maxVal) * 100)
          const destaque = d.valor > 0 && d.valor === maxVal
          return (
            <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
              <span className="text-[10px] font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                {d.valor >= 1000 ? `${(d.valor / 1000).toFixed(1)}k` : d.valor}
              </span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${h}%`, minHeight: d.valor > 0 ? 6 : 2,
                  background: destaque ? "var(--flash-red)" : "var(--ink)",
                  border: "2px solid var(--ink)", borderBottom: "none",
                  opacity: d.valor > 0 ? 1 : 0.25,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-1.5">
        {dados.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">{d.label}</span>
        ))}
      </div>
      {!temDados && <p className="text-xs text-muted-foreground mt-3 text-center">Sem faturamento nos últimos 7 dias.</p>}
    </div>
  )
}
