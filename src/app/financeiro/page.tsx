"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Lancamento } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, Trash2, ArrowUpRight, ArrowDownRight, Check } from "lucide-react"
import { Sticker } from "@/components/stickers"

const CAT_ENTRADA = ["Tatuagem", "Sinal / entrada", "Venda de produto", "Outros"]
const CAT_SAIDA = ["Material", "Aluguel", "Energia", "Marketing", "Impostos", "Comissão", "Manutenção", "Outros"]

const brl = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`
const mesNome = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
function iso(d: Date) { return d.toISOString().split("T")[0] }

export default function FinanceiroPage() {
  const supabase = useMemo(() => createClient(), [])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [ref, setRef] = useState(() => { const d = new Date(); return { ano: d.getFullYear(), mes: d.getMonth() } })

  // form
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("")
  const [valor, setValor] = useState("")
  const [data, setData] = useState(() => iso(new Date()))
  const [pago, setPago] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    supabase.from("lancamentos").select("*").order("data", { ascending: false }).then(({ data }) => {
      setLancamentos((data as Lancamento[]) ?? [])
      setLoading(false)
    })
  }, [supabase])
  useEffect(() => { load() }, [load])

  const inicioMes = iso(new Date(ref.ano, ref.mes, 1))
  const fimMes = iso(new Date(ref.ano, ref.mes + 1, 0))
  const doMes = lancamentos.filter(l => l.data >= inicioMes && l.data <= fimMes)

  const entradas = doMes.filter(l => l.tipo === "entrada" && l.pago).reduce((a, l) => a + l.valor, 0)
  const saidas = doMes.filter(l => l.tipo === "saida" && l.pago).reduce((a, l) => a + l.valor, 0)
  const aReceber = doMes.filter(l => l.tipo === "entrada" && !l.pago).reduce((a, l) => a + l.valor, 0)
  const aPagar = doMes.filter(l => l.tipo === "saida" && !l.pago).reduce((a, l) => a + l.valor, 0)
  const saldo = entradas - saidas

  async function adicionar() {
    if (!valor || Number(valor) <= 0) return alert("Informe um valor.")
    setSalvando(true)
    await supabase.from("lancamentos").insert({
      tipo, descricao: descricao || null, categoria: categoria || null,
      valor: Number(valor), data: data || iso(new Date()), pago,
    })
    setDescricao(""); setCategoria(""); setValor("")
    setSalvando(false)
    load()
  }

  async function alternarPago(l: Lancamento) {
    await supabase.from("lancamentos").update({ pago: !l.pago }).eq("id", l.id)
    setLancamentos(ls => ls.map(x => x.id === l.id ? { ...x, pago: !x.pago } : x))
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este lançamento?")) return
    await supabase.from("lancamentos").delete().eq("id", id)
    setLancamentos(ls => ls.filter(x => x.id !== id))
  }

  function mudarMes(delta: number) {
    setRef(r => { const d = new Date(r.ano, r.mes + delta, 1); return { ano: d.getFullYear(), mes: d.getMonth() } })
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="page-eyebrow flex items-center gap-2"><Sticker.Estrela size={16} /> INK.SYSTEM</p>
          <h1 className="page-title mt-1">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Livro-caixa do estúdio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mudarMes(-1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-card" style={{ border: "2px solid var(--ink)" }}><ChevronLeft size={16} /></button>
          <span className="text-sm font-black min-w-[9.5rem] text-center" style={{ fontFamily: "'Syne', sans-serif" }}>{mesNome[ref.mes]} {ref.ano}</span>
          <button onClick={() => mudarMes(1)} className="w-9 h-9 rounded-full flex items-center justify-center bg-card" style={{ border: "2px solid var(--ink)" }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flash-card p-5">
          <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: "var(--flash-teal)" }} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Entradas</p>
          <p className="text-2xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif", color: "var(--flash-teal)" }}>{loading ? "—" : brl(entradas)}</p>
          <p className="text-xs text-muted-foreground mt-1">recebido no mês</p>
        </div>
        <div className="flash-card p-5">
          <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: "var(--flash-red)" }} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Saídas</p>
          <p className="text-2xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif", color: "var(--flash-red)" }}>{loading ? "—" : brl(saidas)}</p>
          <p className="text-xs text-muted-foreground mt-1">pago no mês</p>
        </div>
        <div className="flash-card p-5">
          <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: "var(--ink)" }} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Saldo (lucro)</p>
          <p className="text-2xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif", color: saldo >= 0 ? "var(--flash-teal)" : "var(--flash-red)" }}>{loading ? "—" : brl(saldo)}</p>
          <p className="text-xs text-muted-foreground mt-1">entradas − saídas</p>
        </div>
        <div className="flash-card p-5">
          <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: "var(--flash-gold)" }} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">A receber</p>
          <p className="text-2xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>{loading ? "—" : brl(aReceber)}</p>
          <p className="text-xs text-muted-foreground mt-1">entradas pendentes</p>
        </div>
        <div className="flash-card p-5">
          <span className="inline-block w-8 h-[3px] rounded-full mb-3" style={{ background: "var(--flash-blue)" }} />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">A pagar</p>
          <p className="text-2xl font-black leading-none mt-1.5" style={{ fontFamily: "'Syne', sans-serif" }}>{loading ? "—" : brl(aPagar)}</p>
          <p className="text-xs text-muted-foreground mt-1">saídas pendentes</p>
        </div>
      </div>

      {/* Novo lançamento */}
      <section className="flash-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Sticker.Adaga size={20} />
          <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Novo lançamento</h2>
        </div>
        <div className="flex gap-2 mb-4">
          {(["entrada", "saida"] as const).map(t => (
            <button key={t} onClick={() => { setTipo(t); setCategoria("") }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-colors"
              style={tipo === t
                ? { background: t === "entrada" ? "var(--flash-teal)" : "var(--flash-red)", color: "#fff", border: "2px solid var(--ink)" }
                : { background: "var(--paper)", color: "var(--muted-foreground)", border: "2px solid var(--ink)" }}>
              {t === "entrada" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              {t === "entrada" ? "Entrada" : "Saída"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder={tipo === "entrada" ? "Ex: Sessão Lucas" : "Ex: Tinta preta"} /></div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={v => setCategoria(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" /></div>
          <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={pago} onChange={e => setPago(e.target.checked)} className="accent-primary w-4 h-4" />
            {tipo === "entrada" ? "Já recebido" : "Já pago"}
          </label>
          <Button onClick={adicionar} disabled={salvando} className="gap-2"><Plus size={15} /> {salvando ? "Salvando..." : "Adicionar"}</Button>
        </div>
      </section>

      {/* Lista */}
      <section className="flash-card p-5">
        <h2 className="text-base font-black tracking-tight mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Lançamentos de {mesNome[ref.mes]}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Carregando…</p>
        ) : doMes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhum lançamento neste mês.</p>
        ) : (
          <div className="space-y-1">
            {doMes.map(l => (
              <div key={l.id} className="flex items-center justify-between gap-3 py-2.5 border-t first:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: l.tipo === "entrada" ? "var(--flash-teal)" : "var(--flash-red)", border: "2px solid var(--ink)", color: "#fff" }}>
                    {l.tipo === "entrada" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{l.descricao || (l.tipo === "entrada" ? "Entrada" : "Saída")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR")}{l.categoria ? ` · ${l.categoria}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-black tabular-nums" style={{ fontFamily: "'Syne', sans-serif", color: l.tipo === "entrada" ? "var(--flash-teal)" : "var(--flash-red)" }}>
                    {l.tipo === "entrada" ? "+" : "−"}{brl(l.valor)}
                  </span>
                  <button onClick={() => alternarPago(l)} title={l.pago ? "Pago/recebido" : "Pendente — marcar como pago"}
                    className="flash-tag"
                    style={l.pago ? { background: "var(--flash-teal)", color: "#fff" } : { background: "var(--paper)", color: "var(--muted-foreground)" }}>
                    {l.pago ? <><Check size={11} /> ok</> : "pendente"}
                  </button>
                  <button onClick={() => excluir(l.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
