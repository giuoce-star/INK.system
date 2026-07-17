"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Anamnese, Tatuagem } from "@/lib/types"
import { ClienteForm } from "@/components/cliente-form"

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null)
  const [tatuagens, setTatuagens] = useState<Tatuagem[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("*").eq("id", id).single(),
      supabase.from("anamnese").select("*").eq("cliente_id", id).maybeSingle(),
      supabase.from("tatuagens").select("*").eq("cliente_id", id).order("created_at"),
    ]).then(([c, a, t]) => {
      setCliente(c.data)
      setAnamnese(a.data)
      setTatuagens(t.data ?? [])
    })
  }, [id])

  if (!cliente) return <div className="p-4 sm:p-8 text-muted-foreground">Carregando...</div>

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Editar Cliente</h1>
        <p className="text-muted-foreground text-sm mt-1">{cliente.nome}</p>
      </div>
      <ClienteForm cliente={cliente} anamnese={anamnese ?? undefined} tatuagens={tatuagens} />
    </div>
  )
}
