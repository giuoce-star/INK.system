"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Anamnese, Tatuagem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ShieldAlert } from "lucide-react"

const INDICACAO_OPCOES = [
  "Instagram", "Indicação de amigo", "Google", "Passei na frente", "TikTok", "Facebook", "Outro",
]

interface Props {
  cliente?: Cliente
  anamnese?: Anamnese
  tatuagens?: Tatuagem[]
}

function BoolField({ label, name, value, onChange }: {
  label: string
  name: string
  value: boolean
  onChange: (name: string, v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={value === true} onChange={() => onChange(name, true)} className="accent-primary" />
          Sim
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={value === false} onChange={() => onChange(name, false)} className="accent-primary" />
          Não
        </label>
      </div>
    </div>
  )
}

const tatuagemVazia = (): Tatuagem => ({
  ideia_referencia: "",
  estilo: "",
  local_corpo: "",
  tamanho_cm: undefined,
  orcamento: undefined,
  cobertura: false,
})

export function ClienteForm({ cliente, anamnese, tatuagens: tatuagensIniciais }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdicao = !!cliente?.id

  const [dados, setDados] = useState<Partial<Cliente>>({
    nome: "", celular: "", email: "", data_nascimento: "", endereco: "",
    ocupacao: "", indicacao: "", termo_aceito: false, observacoes: "",
    ...cliente,
  })

  const [anan, setAnan] = useState<Partial<Anamnese>>({
    tratamentos_anteriores: false, tratamentos_obs: "",
    doencas: false, doencas_obs: "", herpes: false,
    alergias: false, alergias_obs: "",
    medicamento_continuo: false, medicamento_obs: "",
    fuma: false, bebe: false, gravida: false,
    isotretinoina: false, historico_queloide: false,
    ...anamnese,
  })

  const [tats, setTats] = useState<Tatuagem[]>(
    tatuagensIniciais && tatuagensIniciais.length > 0 ? tatuagensIniciais : [tatuagemVazia()]
  )

  const [salvando, setSalvando] = useState(false)

  function setDado(name: string, value: unknown) {
    setDados(d => ({ ...d, [name]: value }))
  }

  function setAnam(name: string, value: unknown) {
    setAnan(a => ({ ...a, [name]: value }))
  }

  function setTat(index: number, name: keyof Tatuagem, value: unknown) {
    setTats(ts => ts.map((t, i) => i === index ? { ...t, [name]: value } : t))
  }

  function adicionarTatuagem() {
    setTats(ts => [...ts, tatuagemVazia()])
  }

  function removerTatuagem(index: number) {
    setTats(ts => ts.filter((_, i) => i !== index))
  }

  async function salvar() {
    if (!dados.nome?.trim()) return alert("Nome é obrigatório.")
    setSalvando(true)

    if (isEdicao) {
      await supabase.from("clientes").update(dados).eq("id", cliente!.id)
      if (anamnese?.id) {
        await supabase.from("anamnese").update(anan).eq("id", anamnese.id)
      } else {
        await supabase.from("anamnese").insert({ ...anan, cliente_id: cliente!.id })
      }
      // substituir todas as tatuagens existentes
      await supabase.from("tatuagens").delete().eq("cliente_id", cliente!.id)
      const tatsParaSalvar = tats.filter(t => t.local_corpo || t.ideia_referencia || t.estilo)
      if (tatsParaSalvar.length > 0) {
        await supabase.from("tatuagens").insert(tatsParaSalvar.map(t => ({ ...t, cliente_id: cliente!.id })))
      }
      router.push(`/clientes/${cliente!.id}`)
    } else {
      const { data: novo } = await supabase.from("clientes").insert(dados).select().single()
      if (novo) {
        await supabase.from("anamnese").insert({ ...anan, cliente_id: novo.id })
        const tatsParaSalvar = tats.filter(t => t.local_corpo || t.ideia_referencia || t.estilo)
        if (tatsParaSalvar.length > 0) {
          await supabase.from("tatuagens").insert(tatsParaSalvar.map(t => ({ ...t, cliente_id: novo.id })))
        }
        router.push(`/clientes/${novo.id}`)
      }
    }
    setSalvando(false)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="servico">Projeto</TabsTrigger>
          <TabsTrigger value="anamnese" className="gap-1.5">
            <ShieldAlert size={13} />
            Anamnese
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Informações Básicas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={dados.nome ?? ""} onChange={e => setDado("nome", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Celular</Label>
                <Input value={dados.celular ?? ""} onChange={e => setDado("celular", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={dados.email ?? ""} onChange={e => setDado("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={dados.data_nascimento ?? ""} onChange={e => setDado("data_nascimento", e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={dados.endereco ?? ""} onChange={e => setDado("endereco", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ocupação</Label>
                <Input value={dados.ocupacao ?? ""} onChange={e => setDado("ocupacao", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Indicação</Label>
                <Select value={dados.indicacao ?? ""} onValueChange={v => setDado("indicacao", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Como nos conheceu?" /></SelectTrigger>
                  <SelectContent>
                    {INDICACAO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2 pt-2">
                <BoolField label="Termo aceito?" name="termo_aceito" value={!!dados.termo_aceito} onChange={setDado} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={dados.observacoes ?? ""} onChange={e => setDado("observacoes", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servico" className="space-y-4 mt-4">
          {tats.map((tat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Projeto {index + 1}</CardTitle>
                {index > 0 && (
                  <button
                    onClick={() => removerTatuagem(index)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                    Remover
                  </button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Ideia / Referência</Label>
                  <Textarea
                    value={tat.ideia_referencia ?? ""}
                    onChange={e => setTat(index, "ideia_referencia", e.target.value)}
                    placeholder="Descreva a ideia, o desenho, referências enviadas..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estilo</Label>
                  <Input
                    value={tat.estilo ?? ""}
                    onChange={e => setTat(index, "estilo", e.target.value)}
                    placeholder="Ex: Fine line, old school, blackwork..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Local no Corpo</Label>
                  <Input
                    value={tat.local_corpo ?? ""}
                    onChange={e => setTat(index, "local_corpo", e.target.value)}
                    placeholder="Ex: Antebraço esquerdo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tamanho (cm)</Label>
                  <Input
                    type="number"
                    value={tat.tamanho_cm ?? ""}
                    onChange={e => setTat(index, "tamanho_cm", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Orçamento estimado (R$)</Label>
                  <Input
                    type="number"
                    value={tat.orcamento ?? ""}
                    onChange={e => setTat(index, "orcamento", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0,00"
                  />
                </div>
                <div className="md:col-span-2">
                  <BoolField
                    label="É cobertura (cover-up)?"
                    name="cobertura"
                    value={!!tat.cobertura}
                    onChange={(_, v) => setTat(index, "cobertura", v)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" onClick={adicionarTatuagem} className="gap-2">
            <Plus size={14} />
            Adicionar outro projeto
          </Button>
        </TabsContent>

        <TabsContent value="anamnese" className="space-y-4 mt-4">
          {/* Banner de contexto */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5"
            style={{ background: "var(--status-warning)", opacity: 0.9 }}
          >
            <ShieldAlert size={15} className="shrink-0 mt-0.5" style={{ color: "var(--status-warning-foreground)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--status-warning-foreground)" }}>
              <strong>Triagem de saúde obrigatória.</strong> As informações abaixo identificam cuidados e contraindicações. Preencha com atenção antes de iniciar a tatuagem.
            </p>
          </div>

          {/* Grupo 1: Histórico médico */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Histórico médico</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <BoolField label="Possui doenças?" name="doencas" value={!!anan.doencas} onChange={setAnam} />
              {anan.doencas && (
                <div className="pb-2">
                  <Textarea placeholder="Quais doenças?" value={anan.doencas_obs ?? ""} onChange={e => setAnam("doencas_obs", e.target.value)} rows={2} />
                </div>
              )}
              <div style={anan.herpes ? { background: "oklch(0.97 0.03 75)", borderRadius: "0.5rem", padding: "0 0.25rem" } : {}}>
                <BoolField label="Histórico de herpes?" name="herpes" value={!!anan.herpes} onChange={setAnam} />
              </div>
              <BoolField label="Tem alergias?" name="alergias" value={!!anan.alergias} onChange={setAnam} />
              {anan.alergias && (
                <div className="pb-2">
                  <Textarea placeholder="Quais alergias?" value={anan.alergias_obs ?? ""} onChange={e => setAnam("alergias_obs", e.target.value)} rows={2} />
                </div>
              )}
              <BoolField label="Histórico de queloide?" name="historico_queloide" value={!!anan.historico_queloide} onChange={setAnam} />
            </CardContent>
          </Card>

          {/* Grupo 2: Medicamentos e substâncias */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Medicamentos e substâncias</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <BoolField label="Usa medicamento contínuo?" name="medicamento_continuo" value={!!anan.medicamento_continuo} onChange={setAnam} />
              {anan.medicamento_continuo && (
                <div className="pb-2">
                  <Textarea placeholder="Quais medicamentos?" value={anan.medicamento_obs ?? ""} onChange={e => setAnam("medicamento_obs", e.target.value)} rows={2} />
                </div>
              )}
              <div style={anan.isotretinoina ? { background: "oklch(0.97 0.03 75)", borderRadius: "0.5rem", padding: "0 0.25rem" } : {}}>
                <BoolField label="Faz uso de isotretinoína?" name="isotretinoina" value={!!anan.isotretinoina} onChange={setAnam} />
              </div>
              <BoolField label="Fumante?" name="fuma" value={!!anan.fuma} onChange={setAnam} />
              <BoolField label="Consome álcool?" name="bebe" value={!!anan.bebe} onChange={setAnam} />
            </CardContent>
          </Card>

          {/* Grupo 3: Situação atual */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Situação atual</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <div style={anan.gravida ? { background: "oklch(0.97 0.03 75)", borderRadius: "0.5rem", padding: "0 0.25rem" } : {}}>
                <BoolField label="Grávida ou amamentando?" name="gravida" value={!!anan.gravida} onChange={setAnam} />
              </div>
              <BoolField label="Já tem outras tatuagens?" name="tratamentos_anteriores" value={!!anan.tratamentos_anteriores} onChange={setAnam} />
              {anan.tratamentos_anteriores && (
                <div className="pb-2">
                  <Textarea placeholder="Onde, como foi a cicatrização, alguma reação?" value={anan.tratamentos_obs ?? ""} onChange={e => setAnam("tratamentos_obs", e.target.value)} rows={2} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Cadastrar Cliente"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </div>
  )
}
