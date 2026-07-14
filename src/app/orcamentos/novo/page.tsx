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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function NovoOrcamentoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get("cliente") ?? ""
  const supabase = createClient()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState(clienteIdParam)
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [validade, setValidade] = useState("")
  const [obs, setObs] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from("clientes").select("id, nome").order("nome").then(({ data }) => setClientes(data ?? []))
  }, [])

  async function salvar() {
    if (!clienteId) return alert("Selecione um cliente.")
    setSalvando(true)
    const { data: novo } = await supabase.from("orcamentos").insert({
      cliente_id: clienteId,
      descricao: descricao || null,
      valor: valor ? Number(valor) : null,
      validade: validade || null,
      observacoes: obs || null,
      status: "pendente",
    }).select().single()
    setSalvando(false)
    if (novo) router.push(`/orcamentos/${novo.id}`)
  }

  return (
    <div className="p-8 space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Novo Orçamento</h1>
        <p className="text-muted-foreground text-sm mt-1">Registrar proposta para um cliente</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Dados do Orçamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={v => setClienteId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">O orçamento é para um cliente cadastrado. Cadastre o cliente antes, se necessário.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição / ideia da tattoo</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} placeholder="Ex: Fechamento de braço, blackwork, ~20cm..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Válido até</Label>
              <Input type="date" value={validade} onChange={e => setValidade(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Criar Orçamento"}</Button>
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </div>
  )
}

export default function NovoOrcamentoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando...</div>}>
      <NovoOrcamentoForm />
    </Suspense>
  )
}
