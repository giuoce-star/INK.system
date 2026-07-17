"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Cliente } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientePicker } from "@/components/cliente-picker"

function NovaSessaoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("cliente") ?? ""
  const supabase = createClient()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState(clienteIdParam)
  const [data, setData] = useState("")
  const [horario, setHorario] = useState("")
  const [valor, setValor] = useState("")
  const [obs, setObs] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from("clientes").select("id, nome").order("nome").then(({ data }) => setClientes(data ?? []))
  }, [])

  async function salvar() {
    if (!clienteId) return alert("Selecione um cliente.")
    setSalvando(true)

    const { data: ultima } = await supabase
      .from("sessoes")
      .select("numero_sessao")
      .eq("cliente_id", clienteId)
      .order("numero_sessao", { ascending: false })
      .limit(1)
      .single()

    const numero = (ultima?.numero_sessao ?? 0) + 1

    const { data: nova } = await supabase.from("sessoes").insert({
      cliente_id: clienteId,
      numero_sessao: numero,
      data: data || null,
      horario: horario || null,
      valor: valor ? Number(valor) : null,
      observacoes: obs || null,
    }).select().single()

    setSalvando(false)
    if (nova) router.push(`/sessoes/${nova.id}`)
  }

  return (

    <div className="p-8 space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Sessão</h1>
        <p className="text-muted-foreground text-sm mt-1">Registrar sessão de atendimento</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Dados da Sessão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <ClientePicker clientes={clientes} value={clienteId} onChange={setClienteId} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Criar Sessão"}</Button>
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </div>
  )
}

export default function NovaSessaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando...</div>}>
      <NovaSessaoForm />
    </Suspense>
  )
}
