"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ItemEstoque } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Trash2, AlertTriangle, Package } from "lucide-react"
import { Sticker } from "@/components/stickers"

const CATEGORIAS = [
  "Descartáveis",
  "Agulhas & biqueiras",
  "Tintas",
  "Higiene & assepsia",
  "Aftercare",
  "Equipamentos",
  "Papelaria",
  "Outros",
]

export default function EstoquePage() {
  const supabase = useMemo(() => createClient(), [])
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState("")
  const [categoria, setCategoria] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [unidade, setUnidade] = useState("un")
  const [minimo, setMinimo] = useState("")
  const [salvando, setSalvando] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    supabase.from("estoque").select("*").order("nome").then(({ data }) => {
      setItens((data as ItemEstoque[]) ?? [])
      setLoading(false)
    })
  }, [supabase])
  useEffect(() => { load() }, [load])

  const baixos = itens.filter(i => i.quantidade <= i.minimo).length

  async function adicionar() {
    if (!nome.trim()) return alert("Informe o nome do material.")
    setSalvando(true)
    await supabase.from("estoque").insert({
      nome: nome.trim(), categoria: categoria || null,
      quantidade: quantidade ? Number(quantidade) : 0,
      unidade: unidade || "un", minimo: minimo ? Number(minimo) : 0,
    })
    setNome(""); setCategoria(""); setQuantidade(""); setMinimo(""); setUnidade("un")
    setSalvando(false)
    load()
  }

  async function ajustar(item: ItemEstoque, delta: number) {
    const nova = Math.max(0, item.quantidade + delta)
    setItens(is => is.map(x => x.id === item.id ? { ...x, quantidade: nova } : x))
    await supabase.from("estoque").update({ quantidade: nova }).eq("id", item.id)
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este material?")) return
    await supabase.from("estoque").delete().eq("id", id)
    setItens(is => is.filter(x => x.id !== id))
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-4xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="page-eyebrow flex items-center gap-2"><Sticker.Estrela size={16} /> INK.SYSTEM</p>
          <h1 className="page-title mt-1">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {itens.length} materiais · {baixos > 0 ? <b style={{ color: "var(--flash-red)" }}>{baixos} em falta</b> : "tudo em dia"}
          </p>
        </div>
      </div>

      {/* Novo material */}
      <section className="flash-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Package size={20} />
          <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Novo material</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1.5 col-span-2 md:col-span-2"><Label>Material</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Biqueira 7RL" /></div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={v => setCategoria(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Qtd</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" /></div>
          <div className="space-y-1.5"><Label>Mínimo</Label><Input type="number" value={minimo} onChange={e => setMinimo(e.target.value)} placeholder="0" /></div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="space-y-1.5 w-28"><Label>Unidade</Label><Input value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="un / cx / pote" /></div>
          <Button onClick={adicionar} disabled={salvando} className="gap-2 mt-6"><Plus size={15} /> {salvando ? "Salvando..." : "Adicionar"}</Button>
        </div>
      </section>

      {/* Lista */}
      <section className="flash-card p-5">
        <h2 className="text-base font-black tracking-tight mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Materiais</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Carregando…</p>
        ) : itens.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhum material cadastrado ainda.</p>
        ) : (
          <div className="space-y-1">
            {itens.map(i => {
              const baixo = i.quantidade <= i.minimo
              return (
                <div key={i.id} className="flex items-center justify-between gap-3 py-2.5 border-t first:border-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {baixo && <AlertTriangle size={15} style={{ color: "var(--flash-red)" }} className="shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{i.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.categoria || "—"} · mín. {i.minimo} {i.unidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => ajustar(i, -1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-card" style={{ border: "2px solid var(--ink)" }}><Minus size={13} /></button>
                    <span className="text-sm font-black tabular-nums w-16 text-center" style={{ fontFamily: "'Syne', sans-serif", color: baixo ? "var(--flash-red)" : "var(--ink)" }}>
                      {i.quantidade} {i.unidade}
                    </span>
                    <button onClick={() => ajustar(i, 1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-card" style={{ border: "2px solid var(--ink)" }}><Plus size={13} /></button>
                    <button onClick={() => excluir(i.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
