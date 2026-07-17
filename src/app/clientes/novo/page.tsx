import { ClienteForm } from "@/components/cliente-form"

export default function NovoClientePage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
        <p className="text-muted-foreground text-sm mt-1">Preencha os dados para cadastrar</p>
      </div>
      <ClienteForm />
    </div>
  )
}
