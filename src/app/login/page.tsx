"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro("Email ou senha incorretos.")
      setCarregando(false)
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="mb-10 text-center">
          <span
            className="block text-[2.5rem] font-black tracking-[0.02em] leading-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            INK<span style={{ color: "oklch(0.55 0.19 26)" }}>.</span>system
          </span>
          <p className="text-xs text-muted-foreground tracking-[0.35em] uppercase mt-2">
            Gestão de Estúdio de Tatuagem
          </p>
        </div>

        {/* Form */}
        <form onSubmit={entrar} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "oklch(0.96 0.02 80)",
                border: "1px solid oklch(0.88 0.02 80)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.55 0.19 26)")}
              onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.88 0.02 80)")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "oklch(0.96 0.02 80)",
                border: "1px solid oklch(0.88 0.02 80)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.55 0.19 26)")}
              onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.88 0.02 80)")}
            />
          </div>

          {erro && (
            <p className="text-sm text-destructive">{erro}</p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "oklch(0.55 0.19 26)",
              color: "oklch(0.99 0 0)",
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
