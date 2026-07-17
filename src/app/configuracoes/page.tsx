"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save } from "lucide-react"

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [msg, setMsg] = useState("")
  const [nomeEstudio, setNomeEstudio] = useState("")
  const [contatoEstudio, setContatoEstudio] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  useEffect(() => {
    supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      setMsg(data?.mensagem_whatsapp_padrao ?? "")
      setNomeEstudio(data?.nome_estudio ?? "")
      setContatoEstudio(data?.contato_estudio ?? "")
      setCarregando(false)
    })
  }, [])

  async function salvar() {
    setSalvando(true)
    setErroSalvar(null)
    try {
      const { error } = await supabase.from("configuracoes").upsert({
        id: 1,
        mensagem_whatsapp_padrao: msg,
        nome_estudio: nomeEstudio || null,
        contato_estudio: contatoEstudio || null,
      })
      if (error) throw error
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch {
      setErroSalvar("Não foi possível salvar. Verifique a conexão e tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-xl">
      <div className="space-y-1">
        <p className="page-eyebrow">Sistema</p>
        <h1 className="page-title">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize o sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dados do Estúdio</CardTitle>
          <CardDescription className="text-xs">
            Aparecem no cabeçalho dos orçamentos enviados ao cliente (invoice).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do estúdio</Label>
            <Input value={nomeEstudio} onChange={e => { setNomeEstudio(e.target.value); setErroSalvar(null) }} placeholder="Ex: Estúdio Rosa Negra" />
          </div>
          <div className="space-y-1.5">
            <Label>Contato</Label>
            <Input value={contatoEstudio} onChange={e => { setContatoEstudio(e.target.value); setErroSalvar(null) }} placeholder="Ex: @seuestudio · (11) 99999-9999" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mensagem Padrão WhatsApp</CardTitle>
          <CardDescription className="text-xs">
            Use <code className="bg-accent px-1 rounded">{"{nome}"}</code>,{" "}
            <code className="bg-accent px-1 rounded">{"{data}"}</code> e{" "}
            <code className="bg-accent px-1 rounded">{"{horario}"}</code> para personalizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mensagem</Label>
            {carregando ? (
              <div className="animate-pulse rounded-md bg-muted h-[120px] w-full" />
            ) : (
              <Textarea value={msg} onChange={e => { setMsg(e.target.value); setErroSalvar(null) }} rows={5} />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button onClick={salvar} disabled={salvando || carregando} className="gap-2">
          <Save size={14} />
          {salvo ? "Salvo!" : salvando ? "Salvando..." : "Salvar"}
        </Button>
        {erroSalvar && <p className="text-xs" style={{ color: "var(--destructive)" }}>{erroSalvar}</p>}
      </div>
    </div>
  )
}
