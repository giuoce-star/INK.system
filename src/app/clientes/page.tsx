"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ChevronRight, User } from "lucide-react"
import Link from "next/link"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClientes(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.celular ?? "").includes(busca) ||
    (c.email ?? "").toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-10 max-w-4xl space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} cadastrados</p>
        </div>
        <Link href="/clientes/novo">
          <Button size="sm" className="gap-2 rounded-lg font-semibold">
            <Plus size={14} />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, celular ou e-mail..."
          className="pl-10 h-10 rounded-lg bg-card border-border"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </div>
        ) : (
          filtrados.map(c => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <div className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:border-foreground/30 hover:bg-accent/20 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{c.nome}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {c.celular ?? c.email ?? "Sem contato"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden md:block">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : ""}
                  </span>
                  <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
