"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

/**
 * Campo de cliente com busca: digite o nome e a lista filtra na hora.
 * Melhor que um select quando o estúdio tem muitos clientes.
 */
export function ClientePicker({ clientes, value, onChange }: {
  clientes: { id: string; nome: string }[]
  value: string
  onChange: (id: string) => void
}) {
  const [busca, setBusca] = useState("")
  const [aberto, setAberto] = useState(false)

  const selecionado = clientes.find(c => c.id === value)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const base = q ? clientes.filter(c => c.nome.toLowerCase().includes(q)) : clientes
    return base.slice(0, 8)
  }, [clientes, busca])

  if (selecionado) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
        style={{ border: "2px solid var(--ink)", background: "var(--card)" }}>
        <span className="text-sm font-semibold truncate">{selecionado.nome}</span>
        <button type="button" title="Trocar cliente" className="text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => { onChange(""); setBusca(""); setAberto(true) }}>
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        value={busca}
        onChange={e => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        placeholder="Digite o nome do cliente..."
        autoComplete="off"
      />
      {aberto && filtrados.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden max-h-64 overflow-y-auto"
          style={{ border: "2px solid var(--ink)", background: "var(--card)", boxShadow: "3px 3px 0 0 var(--ink)" }}>
          {filtrados.map(c => (
            <button key={c.id} type="button"
              onClick={() => { onChange(c.id); setAberto(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors border-b last:border-0"
              style={{ borderColor: "var(--border)" }}>
              {c.nome}
            </button>
          ))}
        </div>
      )}
      {aberto && busca.trim() && filtrados.length === 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground"
          style={{ border: "2px solid var(--ink)", background: "var(--card)" }}>
          Nenhum cliente encontrado.
        </div>
      )}
    </div>
  )
}
