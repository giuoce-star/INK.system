"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, FileText, Trash2, Check } from "lucide-react"
import { Sticker } from "@/components/stickers"

const CAT_ENTRADA = ["Tatuagem", "Sinal / entrada", "Venda de produto", "Outros"]
const CAT_SAIDA = ["Material", "Aluguel", "Energia", "Marketing", "Impostos", "Comissão", "Manutenção", "Outros"]

interface Linha {
  data: string
  descricao: string
  valor: number
  tipo: "entrada" | "saida"
  categoria: string
  incluir: boolean
}

/* ─── normalização ─── */
function normalizaValor(raw: string): number | null {
  let s = raw.replace(/R\$/gi, "").replace(/\s/g, "").trim()
  if (!s) return null
  const neg = s.startsWith("-") || /^\(.*\)$/.test(s)
  s = s.replace(/[()]/g, "").replace(/^-/, "")
  if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".")
  else s = s.replace(/,/g, "")
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return neg ? -n : n
}

function normalizaData(raw: string): string | null {
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const br = raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (br) {
    const d = br[1].padStart(2, "0"), m = br[2].padStart(2, "0")
    let y = br[3] ?? String(new Date().getFullYear())
    if (y.length === 2) y = "20" + y
    return `${y}-${m}-${d}`
  }
  return null
}

function montaLinha(data: string, descricao: string, valor: number): Linha {
  const tipo = valor < 0 ? "saida" : "entrada"
  return {
    data, descricao: descricao.slice(0, 120) || (tipo === "entrada" ? "Entrada" : "Saída"),
    valor: Math.abs(valor), tipo,
    categoria: tipo === "entrada" ? "Outros" : "Material",
    incluir: true,
  }
}

function splitLinha(linha: string, delim: string): string[] {
  const out: string[] = []
  let cur = "", aspas = false
  for (const ch of linha) {
    if (ch === '"') { aspas = !aspas; continue }
    if (ch === delim && !aspas) { out.push(cur); cur = ""; continue }
    cur += ch
  }
  out.push(cur)
  return out.map(c => c.trim())
}

function parseCSV(texto: string): Linha[] {
  const linhas = texto.split(/\r?\n/).filter(l => l.trim())
  if (!linhas.length) return []
  const amostra = linhas.slice(0, 5).join("\n")
  const delim = (amostra.match(/;/g)?.length ?? 0) > (amostra.match(/,/g)?.length ?? 0) ? ";" : ","

  const out: Linha[] = []
  for (const l of linhas) {
    const cells = splitLinha(l, delim)
    if (cells.length < 2) continue
    const dataCell = cells.find(c => normalizaData(c))
    if (!dataCell) continue
    let valor: number | null = null
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i] === dataCell) continue
      const v = normalizaValor(cells[i])
      if (v !== null && /\d/.test(cells[i])) { valor = v; break }
    }
    if (valor === null || valor === 0) continue
    const desc = cells
      .filter(c => c !== dataCell && normalizaValor(c) === null)
      .sort((a, b) => b.length - a.length)[0] ?? ""
    out.push(montaLinha(normalizaData(dataCell)!, desc, valor))
  }
  return out
}

function parseTexto(texto: string): Linha[] {
  const out: Linha[] = []
  for (const l of texto.split(/\r?\n/)) {
    if (!l.trim()) continue
    const dm = l.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2}/)
    if (!dm) continue
    const vm = l.match(/-?\s?R?\$?\s?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+\.\d{2}/g)
    if (!vm?.length) continue
    const valor = normalizaValor(vm[0])
    if (valor === null || valor === 0) continue
    let desc = l.replace(dm[0], "")
    vm.forEach(v => { desc = desc.replace(v, "") })
    out.push(montaLinha(normalizaData(dm[0])!, desc.replace(/\s{2,}/g, " ").trim(), valor))
  }
  return out
}

/* ─── página ─── */
export default function ImportarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [texto, setTexto] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState("")

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const res = parseCSV(String(reader.result))
      setLinhas(res)
      setAviso(res.length ? "" : "Não consegui identificar lançamentos nesse arquivo. Tente colar o texto.")
    }
    reader.readAsText(f, "utf-8")
  }

  function analisarTexto() {
    const res = parseTexto(texto)
    setLinhas(res)
    setAviso(res.length ? "" : "Não encontrei linhas com data e valor. Confira se colou o extrato completo.")
  }

  function set(i: number, campo: keyof Linha, v: unknown) {
    setLinhas(ls => ls.map((l, idx) => idx === i ? { ...l, [campo]: v } : l))
  }

  const selecionadas = linhas.filter(l => l.incluir)
  const totalEnt = selecionadas.filter(l => l.tipo === "entrada").reduce((a, l) => a + l.valor, 0)
  const totalSai = selecionadas.filter(l => l.tipo === "saida").reduce((a, l) => a + l.valor, 0)

  async function importar() {
    if (!selecionadas.length) return
    setSalvando(true)
    await supabase.from("lancamentos").insert(
      selecionadas.map(l => ({
        tipo: l.tipo, descricao: l.descricao, categoria: l.categoria,
        valor: l.valor, data: l.data, pago: true,
      }))
    )
    setSalvando(false)
    router.push("/financeiro")
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
      <div>
        <Link href="/financeiro" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> Voltar ao Financeiro
        </Link>
        <p className="page-eyebrow flex items-center gap-2"><Sticker.Estrela size={16} /> INK.SYSTEM</p>
        <h1 className="page-title mt-1">Importar extrato</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Suba um CSV ou cole o texto do extrato. Você confere tudo antes de salvar.</p>
      </div>

      {/* Entradas de dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="flash-card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <Upload size={18} />
            <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Arquivo CSV</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Exporte o extrato do seu banco em CSV e escolha o arquivo aqui.</p>
          <input type="file" accept=".csv,text/csv,text/plain" onChange={aoEscolherArquivo}
            className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-black file:text-sm file:font-bold file:bg-card file:cursor-pointer" />
        </section>

        <section className="flash-card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <FileText size={18} />
            <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Colar do PDF</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Abra o PDF, selecione tudo (Ctrl+A), copie (Ctrl+C) e cole abaixo.</p>
          <Textarea value={texto} onChange={e => setTexto(e.target.value)} rows={4} placeholder="Cole aqui o texto do extrato..." />
          <Button size="sm" className="mt-3 gap-2" onClick={analisarTexto} disabled={!texto.trim()}>
            Analisar texto
          </Button>
        </section>
      </div>

      {aviso && (
        <div className="flash-card-flat px-5 py-3.5" style={{ borderColor: "var(--flash-red)" }}>
          <span className="text-sm">{aviso}</span>
        </div>
      )}

      {/* Conferência */}
      {linhas.length > 0 && (
        <section className="flash-card p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h2 className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Confira antes de importar
            </h2>
            <span className="text-xs text-muted-foreground">{selecionadas.length} de {linhas.length} selecionados</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Corrija o que estiver errado, escolha a categoria e desmarque o que não quer importar.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
                  <th className="pb-2 font-bold w-8"></th>
                  <th className="pb-2 font-bold">Data</th>
                  <th className="pb-2 font-bold">Descrição</th>
                  <th className="pb-2 font-bold">Tipo</th>
                  <th className="pb-2 font-bold">Categoria</th>
                  <th className="pb-2 font-bold text-right">Valor</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)", opacity: l.incluir ? 1 : 0.45 }}>
                    <td className="py-2">
                      <input type="checkbox" checked={l.incluir} onChange={e => set(i, "incluir", e.target.checked)} className="accent-primary w-4 h-4" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="date" value={l.data} onChange={e => set(i, "data", e.target.value)}
                        className="w-[9rem] px-2 py-1 rounded-lg text-xs bg-card" style={{ border: "1.5px solid var(--ink)" }} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={l.descricao} onChange={e => set(i, "descricao", e.target.value)}
                        className="w-full min-w-[10rem] px-2 py-1 rounded-lg text-xs bg-card" style={{ border: "1.5px solid var(--ink)" }} />
                    </td>
                    <td className="py-2 pr-2">
                      <select value={l.tipo}
                        onChange={e => { const t = e.target.value as "entrada" | "saida"; set(i, "tipo", t); set(i, "categoria", t === "entrada" ? "Outros" : "Material") }}
                        className="px-2 py-1 rounded-lg text-xs bg-card" style={{ border: "1.5px solid var(--ink)" }}>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select value={l.categoria} onChange={e => set(i, "categoria", e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs bg-card" style={{ border: "1.5px solid var(--ink)" }}>
                        {(l.tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2 text-right">
                      <input type="number" step="0.01" value={l.valor} onChange={e => set(i, "valor", Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded-lg text-xs text-right bg-card tabular-nums" style={{ border: "1.5px solid var(--ink)" }} />
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => setLinhas(ls => ls.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
            <div className="text-sm">
              <span style={{ color: "var(--flash-teal)" }}>+ R$ {totalEnt.toLocaleString("pt-BR")}</span>
              {" · "}
              <span style={{ color: "var(--flash-red)" }}>− R$ {totalSai.toLocaleString("pt-BR")}</span>
            </div>
            <Button onClick={importar} disabled={salvando || !selecionadas.length} className="gap-2">
              <Check size={15} /> {salvando ? "Importando..." : `Importar ${selecionadas.length} lançamento${selecionadas.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
