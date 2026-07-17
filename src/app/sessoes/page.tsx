"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ChevronRight, Calendar } from "lucide-react"
import Link from "next/link"

interface SessaoComCliente {
  id: string
  numero_sessao: number
  data?: string
  horario?: string
  valor?: number
  status: string
  clientes: { nome: string } | null
}

function SessaoRow({ s }: { s: SessaoComCliente }) {
  return (
    <Link href={`/sessoes/${s.id}`}>
      <div className="group flex items-center justify-between rounded-xl px-5 py-4 cursor-pointer card-elevated">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
            <Calendar size={14} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">{s.clientes?.nome ?? "—"}</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {s.data ? new Date(s.data + "T12:00:00").toLocaleDateString("pt-BR") : "Data não definida"}
              {s.horario ? ` às ${s.horario.slice(0, 5)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-mono">#{s.numero_sessao}</Badge>
          {s.valor != null && (
            <span className="text-sm font-semibold hidden md:block">
              R$ {Number(s.valor).toFixed(2)}
            </span>
          )}
          <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  )
}

export default function SessoesPage() {
  const [sessoes, setSessoes] = useState<SessaoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("sessoes")
      .select("id, numero_sessao, data, horario, valor, status, clientes(nome)")
      .order("data", { ascending: false })
      .then(({ data }) => {
        setSessoes((data as unknown as SessaoComCliente[]) ?? [])
        setLoading(false)
      })
  }, [])

  const agendadas = sessoes.filter(s => (s.status ?? "agendada") !== "realizada")
  const realizadas = sessoes.filter(s => s.status === "realizada")

  return (
    <div className="p-4 sm:p-10 max-w-4xl space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Sessões</h1>
          <p className="text-sm text-muted-foreground">{sessoes.length} registradas</p>
        </div>
        <Link href="/sessoes/nova">
          <Button size="sm" className="gap-2 rounded-lg font-semibold">
            <Plus size={14} />
            Nova Sessão
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-16 text-sm">Carregando...</div>
      ) : (
        <Tabs defaultValue="agendadas">
          <TabsList>
            <TabsTrigger value="agendadas">
              Agendadas
              {agendadas.length > 0 && (
                <span
                  className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "oklch(0.65 0.08 45 / 0.15)", color: "oklch(0.78 0.10 45)" }}
                >
                  {agendadas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="realizadas">
              Realizadas
              {realizadas.length > 0 && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {realizadas.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agendadas" className="mt-4 space-y-1.5">
            {agendadas.length === 0 ? (
              <div className="text-center text-muted-foreground py-16 text-sm">Nenhuma sessão agendada.</div>
            ) : (
              agendadas.map(s => <SessaoRow key={s.id} s={s} />)
            )}
          </TabsContent>

          <TabsContent value="realizadas" className="mt-4 space-y-1.5">
            {realizadas.length === 0 ? (
              <div className="text-center text-muted-foreground py-16 text-sm">Nenhuma sessão realizada ainda.</div>
            ) : (
              realizadas.map(s => <SessaoRow key={s.id} s={s} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
